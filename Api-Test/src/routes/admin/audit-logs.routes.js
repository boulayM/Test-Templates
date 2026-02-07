import { Router } from "express";
import auditLogRoutes from "../auditLog.routes.js";

const router = Router();

router.use("/", auditLogRoutes);

export default router;
