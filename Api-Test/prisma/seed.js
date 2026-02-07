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

async function main() {
  const now = new Date();
  const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const verifyExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await resetDatabase();

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const userPasswordHash = await bcrypt.hash("User123!", 10);

  await prisma.user.createMany({
    data: [
      {
        firstName: "Admin",
        lastName: "Root",
        email: "admin@test.local",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        emailVerified: true,
        isActive: true
      },
      {
        firstName: "Alice",
        lastName: "Dupont",
        email: "alice@test.local",
        passwordHash: userPasswordHash,
        role: "USER",
        emailVerified: true,
        isActive: true
      },
      {
        firstName: "Logi",
        lastName: "Team",
        email: "logi@test.local",
        passwordHash: userPasswordHash,
        role: "LOGISTIQUE",
        emailVerified: true,
        isActive: true
      },
      {
        firstName: "Compta",
        lastName: "Team",
        email: "compta@test.local",
        passwordHash: userPasswordHash,
        role: "COMPTABILITE",
        emailVerified: true,
        isActive: true
      },
      {
        firstName: "Bob",
        lastName: "Martin",
        email: "bob@test.local",
        passwordHash: userPasswordHash,
        role: "USER",
        emailVerified: false,
        isActive: true
      }
    ]
  });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, emailVerified: true }
  });

  const byEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const alice = byEmail["alice@test.local"];

  const category = await prisma.category.create({
    data: {
      name: "Category E2E",
      slug: "category-e2e"
    }
  });

  const product = await prisma.product.create({
    data: {
      name: "Product E2E",
      slug: "product-e2e",
      description: "Product seeded for e2e workflows",
      priceCents: 1999,
      currency: "EUR",
      sku: "SKU-E2E-001",
      isActive: true
    }
  });

  await prisma.productCategory.create({
    data: {
      productId: product.id,
      categoryId: category.id
    }
  });

  await prisma.inventory.create({
    data: {
      productId: product.id,
      quantity: 30,
      reserved: 2
    }
  });

  const shippingAddress = await prisma.address.create({
    data: {
      userId: alice.id,
      label: "Home",
      fullName: "Alice Dupont",
      phone: "+33100000000",
      line1: "1 rue de test",
      postalCode: "75001",
      city: "Paris",
      country: "FR",
      isDefault: true
    }
  });

  const billingAddress = await prisma.address.create({
    data: {
      userId: alice.id,
      label: "Billing",
      fullName: "Alice Dupont",
      phone: "+33100000001",
      line1: "2 rue de facturation",
      postalCode: "75002",
      city: "Paris",
      country: "FR",
      isDefault: false
    }
  });

  const cart = await prisma.cart.create({
    data: {
      userId: alice.id,
      status: "CONVERTED"
    }
  });

  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: product.id,
      quantity: 2,
      unitPriceCents: 1999,
      currency: "EUR"
    }
  });

  const order = await prisma.order.create({
    data: {
      userId: alice.id,
      cartId: cart.id,
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
      status: "PAID",
      subtotalCents: 3998,
      shippingCents: 500,
      discountCents: 0,
      totalCents: 4498,
      currency: "EUR"
    }
  });

  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: 2,
      unitPriceCents: 1999,
      currency: "EUR"
    }
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "MANUAL",
      providerRef: "PAY-E2E-001",
      amountCents: 4498,
      currency: "EUR",
      status: "AUTHORIZED"
    }
  });

  await prisma.shipment.create({
    data: {
      orderId: order.id,
      carrier: "Colissimo",
      trackingNumber: "TRACK-E2E-001",
      status: "CREATED"
    }
  });

  await prisma.coupon.create({
    data: {
      code: "E2E10",
      type: "PERCENT",
      value: 10,
      minOrderCents: 1000,
      isActive: true
    }
  });

  for (const user of users) {
    const refreshRaw = crypto.randomBytes(32).toString("hex");
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshRaw),
        userId: user.id,
        expiresAt: refreshExpiresAt
      }
    });

    if (user.emailVerified === false) {
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

  console.log("Seed completed");
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