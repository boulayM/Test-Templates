import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;
const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
const userEmail = "zod_user_" + Date.now() + "@test.local";
const userPassword = "User123!";

async function ensureUsers() {
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(userPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName: "Admin",
      lastName: "Root",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Admin",
      lastName: "Root",
      email: adminEmail,
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: true,
      isActive: true
    }
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      firstName: "Zod",
      lastName: "User",
      passwordHash: userHash,
      role: "USER",
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "Zod",
      lastName: "User",
      email: userEmail,
      passwordHash: userHash,
      role: "USER",
      emailVerified: true,
      isActive: true
    }
  });
}

async function login(email, password) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return agent;
}

describe("zod validation", () => {
  beforeAll(async () => {
    const mod = await import("../../src/app.js");
    app = mod.default;

    await prisma.orderCoupon.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.payment.deleteMany();
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

    await ensureUsers();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("rejects invalid category payload", async () => {
    const admin = await login(adminEmail, adminPassword);
    const res = await admin.post("/api/admin/categories").send({
      name: "A",
      slug: ""
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_REQUEST");
  });

  test("rejects invalid product id param", async () => {
    const res = await request(app).get("/api/public/products/abc");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_REQUEST");
  });

  test("rejects invalid cart item payload", async () => {
    const user = await login(userEmail, userPassword);
    const res = await user.post("/api/public/cart/items").send({
      productId: 0,
      quantity: -1
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_REQUEST");
  });

  test("rejects coupon validate without code", async () => {
    const res = await request(app).get("/api/public/coupons/validate");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("BAD_REQUEST");
  });
});
