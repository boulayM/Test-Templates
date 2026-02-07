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

async function loginAdmin() {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({
    email: adminEmail,
    password: adminPassword
  });
  expect(res.status).toBe(200);
  expect(res.body.csrfToken).toBeDefined();
  return { agent, csrfToken: res.body.csrfToken };
}

describe("users", () => {
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

  it("lists users", async () => {
    const { agent, csrfToken } = await loginAdmin();
    const res = await agent.get("/api/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("registers a user and rejects duplicate email", async () => {
    const { agent, csrfToken } = await loginAdmin();
    const email = "u_" + Date.now() + "@test.local";

    const payload = {
      firstName: "E2E",
      lastName: "User",
      email,
      password: "User123!",
      role: "USER",
      emailVerified: true,
      isActive: true
    };

    const res1 = await agent
      .post("/api/users/register")
      .set("x-csrf-token", csrfToken)
      .send(payload);
    expect(res1.status).toBe(201);

    const res2 = await agent
      .post("/api/users/register")
      .set("x-csrf-token", csrfToken)
      .send(payload);
    expect(res2.status).toBe(400);
  });

  it("updates a user with csrf", async () => {
    const { agent, csrfToken } = await loginAdmin();
    const hash = await bcrypt.hash("User123!", 10);
    const user = await prisma.user.create({
      data: {
        firstName: "To",
        lastName: "Update",
        email: "to_update_" + Date.now() + "@test.local",
        passwordHash: hash,
        role: "USER",
        emailVerified: true,
        isActive: true
      }
    });

    const res = await agent
      .patch("/api/users/" + user.id)
      .set("x-csrf-token", csrfToken)
      .send({ firstName: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  it("rejects update without csrf", async () => {
    const { agent, csrfToken } = await loginAdmin();
    const hash = await bcrypt.hash("User123!", 10);
    const user = await prisma.user.create({
      data: {
        firstName: "No",
        lastName: "Csrf",
        email: "no_csrf_" + Date.now() + "@test.local",
        passwordHash: hash,
        role: "USER",
        emailVerified: true,
        isActive: true
      }
    });

    const res = await agent
      .patch("/api/users/" + user.id)
      .send({ firstName: "Blocked" });

    expect(res.status).toBe(403);
  });

  it("deletes a user with csrf", async () => {
    const { agent, csrfToken } = await loginAdmin();
    const hash = await bcrypt.hash("User123!", 10);
    const user = await prisma.user.create({
      data: {
        firstName: "To",
        lastName: "Delete",
        email: "to_delete_" + Date.now() + "@test.local",
        passwordHash: hash,
        role: "USER",
        emailVerified: true,
        isActive: true
      }
    });

    const res = await agent
      .delete("/api/users/" + user.id)
      .set("x-csrf-token", csrfToken);

    expect(res.status).toBe(200);
  });

  it("exports users csv", async () => {
    const { agent, csrfToken } = await loginAdmin();
    const res = await agent.get("/api/users/export");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("id,firstName,lastName,email,role,emailVerified,isActive,createdAt");
  });
});
