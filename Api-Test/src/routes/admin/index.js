import { Router } from "express";

import usersRoutes from "../user.routes.js";
import auditLogRoutes from "../auditLog.routes.js";

const router = Router();

// Reuse existing socle handlers during the transition.
router.use("/users", usersRoutes);
router.use("/audit-logs", auditLogRoutes);

export default router;
