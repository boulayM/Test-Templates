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
});