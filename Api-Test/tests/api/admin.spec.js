import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

async function ensureAdmin() {
  const hash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: "Admin",
      lastName: "Root",
      passwordHash: hash,
      role: "ADMIN",
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Admin",
      lastName: "Root",
      email: adminEmail,
      passwordHash: hash,
      role: "ADMIN",
      emailVerified: true,
      isActive: true
    }
  });
}

async function seedCatalog() {
  const category = await prisma.category.create({
    data: {
      name: "Cat Admin " + Date.now(),
      slug: "cat-admin-" + Date.now()
    }
  });
  const product = await prisma.product.create({
    data: {
      name: "Product Admin",
      slug: "product-admin-" + Date.now(),
      description: "desc",
      priceCents: 2000,
      currency: "EUR",
      sku: "SKU-ADMIN-" + Date.now(),
      isActive: true
    }
  });
  await prisma.productCategory.create({
    data: { productId: product.id, categoryId: category.id }
  });
  await prisma.inventory.create({
    data: { productId: product.id, quantity: 5, reserved: 0 }
  });
}

async function loginAdmin() {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({
    email: adminEmail,
    password: adminPassword
  });
  expect(res.status).toBe(200);
  return { agent };
}

async function seedPaidOrderForUser(userId) {
  const stamp = Date.now();
  const address = await prisma.address.create({
    data: {
      userId,
      label: "Admin Seed " + stamp,
      fullName: "Admin Root",
      phone: "0600000000",
      line1: "1 rue admin",
      line2: null,
      postalCode: "75000",
      city: "Paris",
      country: "FR",
      isDefault: false
    }
  });

  const order = await prisma.order.create({
    data: {
      userId,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      status: "PAID",
      subtotalCents: 1000,
      shippingCents: 0,
      discountCents: 0,
      totalCents: 1000,
      currency: "EUR"
    }
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "MANUAL",
      providerRef: "ADMIN-SEED-" + stamp,
      amountCents: 1000,
      currency: "EUR",
      status: "CAPTURED"
    }
  });

  return { order };
}

describe("admin api", () => {
  beforeAll(async () => {
    const mod = await import("../../src/app.js");
    app = mod.default;

    await prisma.orderCoupon.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.review.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.productCategory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.address.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();

    await ensureAdmin();
    await seedCatalog();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("admin list endpoints", async () => {
    const { agent } = await loginAdmin();

    const res1 = await agent.get("/api/admin/categories");
    expect(res1.status).toBe(200);

    const res2 = await agent.get("/api/admin/products");
    expect(res2.status).toBe(200);

    const res3 = await agent.get("/api/admin/inventory");
    expect(res3.status).toBe(200);

    const res4 = await agent.get("/api/admin/coupons");
    expect(res4.status).toBe(200);

    const res5 = await agent.get("/api/admin/reviews");
    expect(res5.status).toBe(200);

    const res6 = await agent.get("/api/admin/shipments");
    expect(res6.status).toBe(200);

    const res7 = await agent.get("/api/admin/orders");
    expect(res7.status).toBe(200);

    const res8 = await agent.get("/api/admin/payments");
    expect(res8.status).toBe(200);

    const res9 = await agent.get("/api/admin/users");
    expect(res9.status).toBe(200);
  });

  test("admin categories CRUD", async () => {
    const { agent } = await loginAdmin();
    const stamp = Date.now();

    const create = await agent.post("/api/admin/categories").send({
      name: "CRUD Cat " + stamp,
      slug: "crud-cat-" + stamp
    });
    expect(create.status).toBe(201);
    const id = create.body.category.id;

    const update = await agent.patch("/api/admin/categories/" + id).send({
      name: "CRUD Cat Updated " + stamp
    });
    expect(update.status).toBe(200);
    expect(update.body.category.name).toContain("Updated");

    const del = await agent.delete("/api/admin/categories/" + id);
    expect(del.status).toBe(200);
  });

  test("admin products CRUD", async () => {
    const { agent } = await loginAdmin();
    const stamp = Date.now();
    const category = await prisma.category.create({
      data: { name: "ProdCat " + stamp, slug: "prodcat-" + stamp }
    });

    const create = await agent.post("/api/admin/products").send({
      name: "CRUD Product " + stamp,
      slug: "crud-product-" + stamp,
      description: "desc",
      priceCents: 1234,
      currency: "EUR",
      sku: "CRUD-SKU-" + stamp,
      isActive: true,
      categoryIds: [category.id]
    });
    expect(create.status).toBe(201);
    const id = create.body.product.id;

    const update = await agent.patch("/api/admin/products/" + id).send({
      priceCents: 1500,
      isActive: false
    });
    expect(update.status).toBe(200);
    expect(update.body.product.priceCents).toBe(1500);
    expect(update.body.product.isActive).toBe(false);

    const del = await agent.delete("/api/admin/products/" + id);
    expect(del.status).toBe(200);
  });

  test("admin product images CRUD", async () => {
    const { agent } = await loginAdmin();
    const stamp = Date.now();
    const product = await prisma.product.create({
      data: {
        name: "Img Product " + stamp,
        slug: "img-product-" + stamp,
        description: "desc",
        priceCents: 1000,
        currency: "EUR",
        sku: "IMG-SKU-" + stamp,
        isActive: true
      }
    });

    const create = await agent.post("/api/admin/images").send({
      productId: product.id,
      url: "https://cdn.example.com/p-" + stamp + ".jpg",
      alt: "main",
      sortOrder: 1
    });
    expect(create.status).toBe(201);
    const id = create.body.image.id;

    const list = await agent.get("/api/admin/images").query({ productId: product.id });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.some((img) => img.id === id)).toBe(true);

    const del = await agent.delete("/api/admin/images/" + id);
    expect(del.status).toBe(200);
  });

  test("admin inventory create and update", async () => {
    const { agent } = await loginAdmin();
    const stamp = Date.now();
    const product = await prisma.product.create({
      data: {
        name: "Inv Product " + stamp,
        slug: "inv-product-" + stamp,
        description: "desc",
        priceCents: 1300,
        currency: "EUR",
        sku: "INV-SKU-" + stamp,
        isActive: true
      }
    });

    const create = await agent.post("/api/admin/inventory").send({
      productId: product.id,
      quantity: 20,
      reserved: 2
    });
    expect(create.status).toBe(201);
    const id = create.body.inventory.id;

    const update = await agent.patch("/api/admin/inventory/" + id).send({
      quantity: 25
    });
    expect(update.status).toBe(200);
    expect(update.body.inventory.quantity).toBe(25);
  });

  test("admin coupons CRUD", async () => {
    const { agent } = await loginAdmin();
    const stamp = Date.now();

    const create = await agent.post("/api/admin/coupons").send({
      code: "CRUD" + stamp,
      type: "PERCENT",
      value: 10,
      usageLimit: 5,
      isActive: true
    });
    expect(create.status).toBe(201);
    const id = create.body.coupon.id;

    const update = await agent.patch("/api/admin/coupons/" + id).send({
      value: 15,
      isActive: false
    });
    expect(update.status).toBe(200);
    expect(update.body.coupon.value).toBe(15);
    expect(update.body.coupon.isActive).toBe(false);

    const del = await agent.delete("/api/admin/coupons/" + id);
    expect(del.status).toBe(200);
  });

  test("admin shipments CRUD", async () => {
    const { agent } = await loginAdmin();
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const { order } = await seedPaidOrderForUser(admin.id);

    const create = await agent.post("/api/admin/shipments").send({
      orderId: order.id,
      carrier: "DHL",
      trackingNumber: "TRACK-" + Date.now()
    });
    expect(create.status).toBe(201);
    const id = create.body.shipment.id;

    const update = await agent.patch("/api/admin/shipments/" + id).send({
      status: "IN_TRANSIT"
    });
    expect(update.status).toBe(200);
    expect(update.body.shipment.status).toBe("IN_TRANSIT");

    const del = await agent.delete("/api/admin/shipments/" + id);
    expect(del.status).toBe(200);
  });
});
