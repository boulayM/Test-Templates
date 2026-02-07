import { Router } from "express";
import { authRequired } from "../../middlewares/auth.js";
import { requirePermission } from "../../middlewares/permissions.js";
import { listAuditLogs, exportAuditLogs, getAuditLog } from "../../controllers/auditLogController.js";

const router = Router();

router.get("/", authRequired, requirePermission("audit-logs.read"), listAuditLogs);
router.get("/export", authRequired, requirePermission("audit-logs.export"), exportAuditLogs);
router.get("/:id", authRequired, requirePermission("audit-logs.read"), getAuditLog);

export default router;