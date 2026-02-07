import request from "supertest";
import bcrypt from "bcryptjs";
import prisma from "../../src/config/prisma.js";
import { connectMongo, disconnectMongo } from "../../src/config/mongoose.js";

process.env.DISABLE_RATE_LIMIT = "true";

let app;
let mongoReady = false;

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
  return { agent, csrfToken: res.body.csrfToken };
}

describe("audit-logs", () => {
  beforeAll(async () => {
    const mod = await import("../../src/app.js");
    app = mod.default;

    mongoReady = await connectMongo();
    await prisma.refreshToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
    await ensureAdmin();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await disconnectMongo();
  });

  it("lists audit logs", async () => {
    if (!mongoReady) return;
    const { agent } = await loginAdmin();
    const res = await agent.get("/api/audit-logs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("exports audit logs csv", async () => {
    if (!mongoReady) return;
    const { agent } = await loginAdmin();
    const res = await agent.get("/api/audit-logs/export");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("id,action,actorEmail,actorId,actorRole,targetType,targetId,status,requestId,createdAt");
  });

  it("records key auth actions in audit logs", async () => {
    if (!mongoReady) return;

    const wrongLogin = await request(app).post("/api/auth/login").send({
      email: adminEmail,
      password: "WrongPassword!"
    });
    expect(wrongLogin.status).toBe(400);

    const { agent: firstAgent, csrfToken } = await loginAdmin();
    const logoutAll = await firstAgent.post("/api/auth/logout-all").set("x-csrf-token", csrfToken);
    expect(logoutAll.status).toBe(200);

    const { agent: adminAgent } = await loginAdmin();

    const failLogs = await adminAgent
      .get("/api/audit-logs")
      .query({ filters: JSON.stringify({ action: "LOGIN_FAIL" }), limit: 5 });
    expect(failLogs.status).toBe(200);
    expect(Array.isArray(failLogs.body.data)).toBe(true);
    expect(failLogs.body.data.length).toBeGreaterThan(0);

    const logoutAllLogs = await adminAgent
      .get("/api/audit-logs")
      .query({ filters: JSON.stringify({ action: "LOGOUT_ALL" }), limit: 5 });
    expect(logoutAllLogs.status).toBe(200);
    expect(Array.isArray(logoutAllLogs.body.data)).toBe(true);
    expect(logoutAllLogs.body.data.length).toBeGreaterThan(0);
  });
});
