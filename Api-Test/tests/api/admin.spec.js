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
});
