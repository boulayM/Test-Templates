import { createAuditLog } from "../services/auditLogService.js";

const PERMISSIONS = {
  ADMIN: ["*"],
  MANAGER: [
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "products.export",
    "products.batch",
    "orders.read",
    "orders.updateStatus",
    "orders.delete",
    "orders.export",
    "orders.batch",
    "audit-logs.read",
    "audit-logs.export",
    "metrics.read"
  ],
  SUPPORT: ["orders.read", "orders.export", "audit-logs.read", "audit-logs.export", "metrics.read"],
  READONLY: [
    "users.read",
    "users.export",
    "products.read",
    "products.export",
    "orders.read",
    "orders.export",
    "audit-logs.read",
    "audit-logs.export",
    "metrics.read"
  ],
  USER: ["products.read", "orders.read", "orders.delete"]
};

function hasPermission(role, permission) {
  if (!role) return false;
  const allowed = PERMISSIONS[role] || [];
  if (allowed.includes("*")) return true;
  return allowed.includes(permission);
}

export function requirePermission(permission) {
  return async (req, res, next) => {
    const role = req.user?.role;
    if (!hasPermission(role, permission)) {
      await createAuditLog({
        userId: req.user?.id ?? null,
        action: "ACCESS_DENIED",
        resourceType: "Permission",
        resourceId: permission,
        status: "DENIED",
        req,
        metadata: { permission }
      });
      return res.status(403).json({ message: "Acces refuse" });
    }
    next();
  };
}