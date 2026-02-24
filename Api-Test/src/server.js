import "dotenv/config";
import app from "./app.js";
import { connectMongo } from "./config/mongoose.js";

const PORT = process.env.PORT || 3000;
const enableAuditLog = String(process.env.ENABLE_AUDIT_LOG || "false").toLowerCase() === "true";

const startServer = async () => {
  if (enableAuditLog) {
    await connectMongo();
  }
  app.listen(PORT, () => {
    console.log("API PostgreSQL prête sur port " + PORT);
  });
};

startServer();
