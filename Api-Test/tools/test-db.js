import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Connexion à la DB réussie !");
    const users = await prisma.user.findMany(); // ou une autre table
    console.log(`🔹 ${users.length} utilisateurs trouvés.`);
  } catch (err) {
    console.error("❌ Erreur de connexion à la DB :", err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
