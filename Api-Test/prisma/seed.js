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

async function main() {
  const now = new Date();
  const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const verifyExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.refreshToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const userPasswordHash = await bcrypt.hash("User123!", 10);

  const users = await prisma.user.createMany({
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
        firstName: "Bob",
        lastName: "Martin",
        email: "bob@test.local",
        passwordHash: userPasswordHash,
        role: "USER",
        emailVerified: false,
        isActive: true
      },
      {
        firstName: "Claire",
        lastName: "Moreau",
        email: "claire@test.local",
        passwordHash: userPasswordHash,
        role: "USER",
        emailVerified: false,
        isActive: true
      },
      {
        firstName: "David",
        lastName: "Petit",
        email: "david@test.local",
        passwordHash: userPasswordHash,
        role: "USER",
        emailVerified: true,
        isActive: true
      }
    ]
  });

  const allUsers = await prisma.user.findMany({
    select: { id: true, emailVerified: true }
  });

  for (const user of allUsers) {
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