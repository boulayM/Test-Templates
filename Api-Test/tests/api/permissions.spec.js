import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;

const userEmail = "user_" + Date.now() + "@test.local";
const userPassword = "User123!";

async function ensureUser() {
  const hash = await bcrypt.hash(userPassword, 10);
  await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      firstName: "User",
      lastName: "Basic",
      passwordHash: hash,
      role: "USER",
      emailVerified: true,
      isActive: true
    },
    create: {
      firstName: "User",
      lastName: "Basic",
      email: userEmail,
      passwordHash: hash,
      role: "USER",
      emailVerified: true,
      isActive: true
    }
  });
}

describe("permissions", () => {
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
    await ensureUser();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("denies users.read for role USER", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").send({
      email: userEmail,
      password: userPassword
    });
    expect(login.status).toBe(200);

    const res = await agent.get("/api/users");
    expect(res.status).toBe(403);
  });

  it("denies audit-logs.read for role USER", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").send({
      email: userEmail,
      password: userPassword
    });
    expect(login.status).toBe(200);

    const res = await agent.get("/api/audit-logs");
    expect(res.status).toBe(403);
  });
});
