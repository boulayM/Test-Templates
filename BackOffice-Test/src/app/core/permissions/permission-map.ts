export type AppRole = 'ADMIN' | 'LOGISTIQUE' | 'COMPTABILITE' | 'USER';

export type AppPermission =
  | 'dashboard.view'
  | 'users.read'
  | 'auditLogs.read'
  | 'categories.read'
  | 'products.read'
  | 'inventory.read'
  | 'orders.read'
  | 'payments.read'
  | 'shipments.read'
  | 'coupons.read'
  | 'reviews.read';

const rolePermissionMap: Record<AppRole, AppPermission[]> = {
  ADMIN: [
    'dashboard.view',
    'users.read',
    'auditLogs.read',
    'categories.read',
    'products.read',
    'inventory.read',
    'orders.read',
    'payments.read',
    'shipments.read',
    'coupons.read',
    'reviews.read',
  ],
  LOGISTIQUE: ['dashboard.view', 'inventory.read', 'orders.read', 'shipments.read'],
  COMPTABILITE: ['dashboard.view', 'orders.read', 'payments.read', 'coupons.read'],
  USER: [],
};

export function hasPermission(role: string | undefined, permission: AppPermission): boolean {
  const roleKey = (role || 'USER') as AppRole;
  const permissions = rolePermissionMap[roleKey] || [];
  return permissions.includes(permission);
}