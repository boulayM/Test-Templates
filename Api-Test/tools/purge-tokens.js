import prisma from "../src/config/prisma.js";

async function main() {
  const now = new Date();

  const refreshResult = await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ revokedAt: { not: null } }, { expiresAt: { lt: now } }]
    }
  });

  const verificationResult = await prisma.verificationToken.deleteMany({
    where: {
      OR: [{ usedAt: { not: null } }, { expiresAt: { lt: now } }]
    }
  });

  console.log(
    `Purged refresh tokens: ${refreshResult.count} | verification tokens: ${verificationResult.count}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
