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

function pickCookie(setCookie, name) {
  const c = setCookie.find((v) => v.startsWith(name + "="));
  return c ? c.split(";")[0] : "";
}

describe("security L2", () => {
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
    await ensureAdmin();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("logout-all revokes all sessions", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword
    });
    expect(login.status).toBe(200);
    const csrfToken = login.body.csrfToken;

    const res = await agent
      .post("/api/auth/logout-all")
      .set("x-csrf-token", csrfToken);

    expect(res.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401);
  });

  it("refresh token reuse revokes all tokens", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword
    });
    expect(login.status).toBe(200);

    const setCookie = login.headers["set-cookie"] || [];
    const accessCookie = pickCookie(setCookie, "accessToken");
    const refreshCookie = pickCookie(setCookie, "refreshToken");
    const csrfCookie = pickCookie(setCookie, "csrfToken");

    const cookieHeader = [accessCookie, refreshCookie, csrfCookie].filter(Boolean).join("; ");

    const refresh1 = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookieHeader);

    expect(refresh1.status).toBe(200);

    const refresh2 = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookieHeader);

    expect(refresh2.status).toBe(401);

    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    const active = await prisma.refreshToken.count({
      where: { userId: admin.id, revokedAt: null }
    });
    expect(active).toBe(0);
  });

  it("users/register requires csrf", async () => {
    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword
    });
    expect(login.status).toBe(200);

    const res = await agent.post("/api/users/register").send({
      firstName: "No",
      lastName: "Csrf",
      email: "no_csrf_" + Date.now() + "@test.local",
      password: "User123!",
      role: "USER",
      emailVerified: true,
      isActive: true
    });

    expect(res.status).toBe(403);
  });

  it("disabled user cannot login", async () => {
    const email = "disabled_login_" + Date.now() + "@test.local";
    const hash = await bcrypt.hash("User123!", 10);
    await prisma.user.create({
      data: {
        firstName: "Disabled",
        lastName: "Login",
        email,
        passwordHash: hash,
        role: "USER",
        emailVerified: true,
        isActive: false
      }
    });

    const res = await request(app).post("/api/auth/login").send({
      email,
      password: "User123!"
    });
    expect(res.status).toBe(403);
  });

  it("disabled user cannot access protected endpoint with existing token", async () => {
    const email = "disabled_token_" + Date.now() + "@test.local";
    const hash = await bcrypt.hash("User123!", 10);
    await prisma.user.create({
      data: {
        firstName: "Disabled",
        lastName: "Token",
        email,
        passwordHash: hash,
        role: "USER",
        emailVerified: true,
        isActive: true
      }
    });

    const agent = request.agent(app);
    const login = await agent.post("/api/auth/login").send({
      email,
      password: "User123!"
    });
    expect(login.status).toBe(200);

    await prisma.user.update({
      where: { email },
      data: { isActive: false }
    });

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(403);
  });
});
