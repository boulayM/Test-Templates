import { createAuditLog } from "../services/auditLogService.js";

const PERMISSIONS = {
  ADMIN: ["*"],

  LOGISTIQUE: [
    "catalog.read",
    "orders.read",
    "orders.own.read",
    "orders.own.create",
    "orders.prepare",
    "orders.ship",
    "orders.deliver",
    "orders.updateStatus",
    "shipments.read",
    "shipments.own.read",
    "shipments.create",
    "shipments.update",
    "inventory.read",
    "inventory.update",
    "audit-logs.read"
  ],

  COMPTABILITE: [
    "catalog.read",
    "payments.read",
    "payments.own.create",
    "payments.validate",
    "payments.refund",
    "orders.read",
    "orders.own.read",
    "coupons.read",
    "coupons.write",
    "reports.finance.read",
    "audit-logs.read"
  ],

  USER: [
    "profile.read",
    "profile.update",
    "addresses.read",
    "addresses.create",
    "addresses.update",
    "addresses.delete",
    "cart.read",
    "cart.update",
    "orders.own.read",
    "orders.own.create",
    "payments.own.create",
    "shipments.own.read",
    "reviews.own.create",
    "reviews.own.update",
    "reviews.own.delete",
    "coupons.validate",
    "products.read",
    "categories.read"
  ]
};

function hasPermission(role, permission) {
  if (!role || !permission) return false;
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
        metadata: { permission, role: role || null }
      });

      return res.status(403).json({ message: "Acces refuse" });
    }

    next();
  };
}

export function getPermissionsForRole(role) {
  return PERMISSIONS[role] || [];
}
