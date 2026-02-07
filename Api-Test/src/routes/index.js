import { Router } from "express";

import authRoutes from "./auth.routes.js";
import csrfRoutes from "./csrf.routes.js";
import userRoutes from "./user.routes.js";
import auditLogRoutes from "./auditLog.routes.js";
import adminRoutes from "./admin/index.js";
import publicRoutes from "./public/index.js";

const router = Router();

// Socle routes kept stable for backward compatibility.
router.use("/auth", authRoutes);
router.use("/csrf", csrfRoutes);
router.use("/users", userRoutes);
router.use("/audit-logs", auditLogRoutes);

// Namespaced routes for the ecommerce project.
router.use("/admin", adminRoutes);
router.use("/public", publicRoutes);

export default router;
