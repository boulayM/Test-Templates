import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function resetDatabase() {
  await prisma.orderCoupon.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

function pick(arr, index) {
  return arr[index % arr.length];
}

function statusByIndex(index) {
  const statuses = ["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
  return statuses[index % statuses.length];
}

function paymentStatusByOrderStatus(orderStatus) {
  if (orderStatus === "PENDING") return "CREATED";
  if (orderStatus === "PAID" || orderStatus === "PREPARING") return "CAPTURED";
  if (orderStatus === "SHIPPED" || orderStatus === "DELIVERED") return "CAPTURED";
  if (orderStatus === "REFUNDED") return "REFUNDED";
  return "FAILED";
}

function shipmentStatusByOrderStatus(orderStatus) {
  if (orderStatus === "PAID" || orderStatus === "PREPARING") return "CREATED";
  if (orderStatus === "SHIPPED") return "IN_TRANSIT";
  if (orderStatus === "DELIVERED") return "DELIVERED";
  if (orderStatus === "REFUNDED") return "LOST";
  return null;
}

async function main() {
  await resetDatabase();

  const now = new Date();
  const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const verifyExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const userPasswordHash = await bcrypt.hash("User123!", 10);

  const userSeed = [
    { firstName: "Admin", lastName: "Root", email: "admin1@test.local", role: "ADMIN", emailVerified: true, isActive: true },
    { firstName: "Admin", lastName: "Ops", email: "admin2@test.local", role: "ADMIN", emailVerified: true, isActive: true },
    { firstName: "Logi", lastName: "One", email: "logi1@test.local", role: "LOGISTIQUE", emailVerified: true, isActive: true },
    { firstName: "Logi", lastName: "Two", email: "logi2@test.local", role: "LOGISTIQUE", emailVerified: true, isActive: true },
    { firstName: "Compta", lastName: "One", email: "compta1@test.local", role: "COMPTABILITE", emailVerified: true, isActive: true },
    { firstName: "Compta", lastName: "Two", email: "compta2@test.local", role: "COMPTABILITE", emailVerified: true, isActive: true },
    { firstName: "Alice", lastName: "Durand", email: "user1@test.local", role: "USER", emailVerified: true, isActive: true },
    { firstName: "Bruno", lastName: "Martin", email: "user2@test.local", role: "USER", emailVerified: true, isActive: true },
    { firstName: "Claire", lastName: "Bernard", email: "user3@test.local", role: "USER", emailVerified: true, isActive: true },
    { firstName: "David", lastName: "Petit", email: "user4@test.local", role: "USER", emailVerified: true, isActive: true },
    { firstName: "Emma", lastName: "Moreau", email: "user5@test.local", role: "USER", emailVerified: true, isActive: true },
    { firstName: "Farid", lastName: "Roux", email: "user6@test.local", role: "USER", emailVerified: true, isActive: true },
    { firstName: "Gael", lastName: "Leroy", email: "user7@test.local", role: "USER", emailVerified: true, isActive: true },
    { firstName: "Hana", lastName: "Fontaine", email: "user8@test.local", role: "USER", emailVerified: true, isActive: true },
    { firstName: "Ines", lastName: "Chevalier", email: "user9@test.local", role: "USER", emailVerified: false, isActive: true },
    { firstName: "Jules", lastName: "Mercier", email: "user10@test.local", role: "USER", emailVerified: true, isActive: false }
  ];

  await prisma.user.createMany({
    data: userSeed.map((u) => ({
      ...u,
      passwordHash: u.role === "ADMIN" ? adminPasswordHash : userPasswordHash
    }))
  });

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, email: true, role: true, emailVerified: true }
  });

  const customerUsers = users.filter((u) => u.role === "USER");

  const categoriesData = [
    { name: "Electronics", slug: "electronics" },
    { name: "Computers", slug: "computers" },
    { name: "Phones", slug: "phones" },
    { name: "Home", slug: "home" },
    { name: "Kitchen", slug: "kitchen" },
    { name: "Sports", slug: "sports" },
    { name: "Outdoors", slug: "outdoors" },
    { name: "Fashion", slug: "fashion" },
    { name: "Beauty", slug: "beauty" },
    { name: "Books", slug: "books" }
  ];

  const createdCategories = [];
  for (const c of categoriesData) {
    const row = await prisma.category.create({ data: c });
    createdCategories.push(row);
  }

  const bySlug = Object.fromEntries(createdCategories.map((c) => [c.slug, c.id]));

  await prisma.category.update({ where: { id: bySlug.computers }, data: { parentId: bySlug.electronics } });
  await prisma.category.update({ where: { id: bySlug.phones }, data: { parentId: bySlug.electronics } });
  await prisma.category.update({ where: { id: bySlug.kitchen }, data: { parentId: bySlug.home } });
  await prisma.category.update({ where: { id: bySlug.outdoors }, data: { parentId: bySlug.sports } });
  await prisma.category.update({ where: { id: bySlug.beauty }, data: { parentId: bySlug.fashion } });

  const products = [];
  for (let i = 1; i <= 12; i += 1) {
    const price = 990 + i * 250;
    const product = await prisma.product.create({
      data: {
        name: `Product ${String(i).padStart(2, "0")}`,
        slug: `product-${String(i).padStart(2, "0")}`,
        description: `Visual QA product ${i}`,
        priceCents: price,
        currency: "EUR",
        sku: `SKU-${String(i).padStart(4, "0")}`,
        isActive: i <= 10
      }
    });
    products.push(product);
  }

  for (let i = 0; i < products.length; i += 1) {
    const p = products[i];
    const c1 = createdCategories[i % createdCategories.length];
    const c2 = createdCategories[(i + 3) % createdCategories.length];

    await prisma.productCategory.createMany({
      data: [
        { productId: p.id, categoryId: c1.id },
        { productId: p.id, categoryId: c2.id }
      ]
    });

    await prisma.productImage.createMany({
      data: [
        {
          productId: p.id,
          url: `https://picsum.photos/seed/product-${p.id}-1/600/400`,
          alt: `Image 1 of ${p.name}`,
          sortOrder: 0
        },
        {
          productId: p.id,
          url: `https://picsum.photos/seed/product-${p.id}-2/600/400`,
          alt: `Image 2 of ${p.name}`,
          sortOrder: 1
        }
      ]
    });

    await prisma.inventory.create({
      data: {
        productId: p.id,
        quantity: i % 4 === 0 ? 0 : 20 + i * 3,
        reserved: i % 5 === 0 ? 2 : i % 3
      }
    });
  }

  const addressesByUser = new Map();
  for (let i = 0; i < Math.min(10, customerUsers.length); i += 1) {
    const user = customerUsers[i];
    const rows = [];
    for (let j = 1; j <= 3; j += 1) {
      const a = await prisma.address.create({
        data: {
          userId: user.id,
          label: j === 1 ? "Home" : j === 2 ? "Work" : "Other",
          fullName: `${user.email.split("@")[0]} User`,
          phone: `+33100000${String(i).padStart(2, "0")}${j}`,
          line1: `${j} Rue Test ${i + 1}`,
          line2: j === 3 ? "Building B" : null,
          postalCode: `750${String(i).padStart(2, "0")}`,
          city: "Paris",
          country: "FR",
          isDefault: j === 1
        }
      });
      rows.push(a);
    }
    addressesByUser.set(user.id, rows);
  }

  const convertedCarts = [];
  const activeCarts = [];

  for (let i = 0; i < Math.min(10, customerUsers.length); i += 1) {
    const user = customerUsers[i];

    const converted = await prisma.cart.create({
      data: { userId: user.id, status: "CONVERTED" }
    });
    convertedCarts.push(converted);

    const active = await prisma.cart.create({
      data: { userId: user.id, status: "ACTIVE" }
    });
    activeCarts.push(active);

    for (let j = 0; j < 2; j += 1) {
      const product = pick(products, i + j);
      await prisma.cartItem.create({
        data: {
          cartId: converted.id,
          productId: product.id,
          quantity: 1 + ((i + j) % 3),
          unitPriceCents: product.priceCents,
          currency: "EUR"
        }
      });
    }

    for (let j = 0; j < 2; j += 1) {
      const product = pick(products, i + j + 4);
      await prisma.cartItem.create({
        data: {
          cartId: active.id,
          productId: product.id,
          quantity: 1,
          unitPriceCents: product.priceCents,
          currency: "EUR"
        }
      });
    }
  }

  for (let i = 0; i < 6; i += 1) {
    const user = customerUsers[i % customerUsers.length];
    const abandoned = await prisma.cart.create({
      data: { userId: user.id, status: "ABANDONED" }
    });
    const product = pick(products, i + 8);
    await prisma.cartItem.create({
      data: {
        cartId: abandoned.id,
        productId: product.id,
        quantity: 1,
        unitPriceCents: product.priceCents,
        currency: "EUR"
      }
    });
  }

  const coupons = [];
  for (let i = 1; i <= 10; i += 1) {
    const isPercent = i % 2 === 0;
    const startsAt = i <= 8 ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const endsAt = i === 9 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const usageLimit = i % 3 === 0 ? 5 : null;
    const usedCount = i === 6 ? 5 : i % 3;

    const coupon = await prisma.coupon.create({
      data: {
        code: `CPN${String(i).padStart(2, "0")}`,
        type: isPercent ? "PERCENT" : "FIXED",
        value: isPercent ? 10 + i : 300 + i * 25,
        minOrderCents: i % 2 === 0 ? 1500 : null,
        startsAt,
        endsAt,
        usageLimit,
        usedCount,
        isActive: i !== 10
      }
    });
    coupons.push(coupon);
  }

  const createdOrders = [];
  const paymentProviders = ["STRIPE", "PAYPAL", "MANUAL"];

  for (let i = 0; i < 24; i += 1) {
    const user = customerUsers[i % customerUsers.length];
    const userAddresses = addressesByUser.get(user.id);
    if (!userAddresses || userAddresses.length < 2) continue;

    const shippingAddress = userAddresses[0];
    const billingAddress = userAddresses[1];
    const linkedCart = convertedCarts[i % convertedCarts.length];

    const lineCount = 2 + (i % 2);
    let subtotalCents = 0;
    const lineDefs = [];

    for (let j = 0; j < lineCount; j += 1) {
      const product = pick(products, i + j);
      const quantity = 1 + ((i + j) % 2);
      subtotalCents += product.priceCents * quantity;
      lineDefs.push({ product, quantity });
    }

    const discountCents = i % 4 === 0 ? 250 : 0;
    const shippingCents = i % 3 === 0 ? 490 : 0;
    const totalCents = subtotalCents + shippingCents - discountCents;
    const orderStatus = statusByIndex(i);

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        cartId: linkedCart ? linkedCart.id : null,
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        status: orderStatus,
        subtotalCents,
        shippingCents,
        discountCents,
        totalCents,
        currency: "EUR"
      }
    });

    for (const line of lineDefs) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: line.product.id,
          productName: line.product.name,
          productSku: line.product.sku,
          quantity: line.quantity,
          unitPriceCents: line.product.priceCents,
          currency: "EUR"
        }
      });
    }

    createdOrders.push(order);
  }

  for (let i = 0; i < createdOrders.length; i += 1) {
    const order = createdOrders[i];

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: pick(paymentProviders, i),
        providerRef: `PAY-${order.id}`,
        amountCents: order.totalCents,
        currency: order.currency,
        status: paymentStatusByOrderStatus(order.status)
      }
    });

    const shipmentStatus = shipmentStatusByOrderStatus(order.status);
    if (shipmentStatus && i < 18) {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          carrier: pick(["Colissimo", "Chronopost", "DHL"], i),
          trackingNumber: `TRK-${order.id}`,
          status: shipmentStatus,
          shippedAt: shipmentStatus === "CREATED" ? null : new Date(now.getTime() - (i + 1) * 3600000),
          deliveredAt: shipmentStatus === "DELIVERED" ? new Date(now.getTime() - i * 1800000) : null
        }
      });
    }

    if (i % 3 === 0) {
      const coupon = coupons[i % coupons.length];
      await prisma.orderCoupon.create({
        data: { orderId: order.id, couponId: coupon.id }
      });
    }
  }

  let reviewCount = 0;
  for (let i = 0; i < customerUsers.length && reviewCount < 30; i += 1) {
    for (let j = 0; j < products.length && reviewCount < 30; j += 1) {
      if ((i + j) % 4 !== 0) continue;
      await prisma.review.create({
        data: {
          userId: customerUsers[i].id,
          productId: products[j].id,
          rating: 1 + ((i + j) % 5),
          comment: `Review ${reviewCount + 1} for product ${products[j].id}`
        }
      });
      reviewCount += 1;
    }
  }

  for (const user of users) {
    const refreshRaw = crypto.randomBytes(32).toString("hex");
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshRaw),
        userId: user.id,
        expiresAt: refreshExpiresAt
      }
    });

    if (!user.emailVerified) {
      const verifyRaw = crypto.randomBytes(32).toString("hex");
      await prisma.verificationToken.create({
        data: {
          tokenHash: hashToken(verifyRaw),
          userId: user.id,
          expiresAt: verifyExpiresAt
        }
      });
    }
  }

  console.log("Visual QA seed completed");
  console.log("Users:", users.length);
  console.log("Categories:", createdCategories.length);
  console.log("Products:", products.length);
  console.log("Orders:", createdOrders.length);
  console.log("Coupons:", coupons.length);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });