import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { permissionGuard } from './core/guards/permission.guard';

import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { LogistiqueDashboardComponent } from './features/logistique/dashboard/logistique-dashboard.component';
import { ComptabiliteDashboardComponent } from './features/comptabilite/dashboard/comptabilite-dashboard.component';
import { RoleDashboardRedirectComponent } from './features/common/role-dashboard-redirect/role-dashboard-redirect.component';
import { RoleFeatureRedirectComponent } from './features/common/role-feature-redirect/role-feature-redirect.component';
import { UsersComponent } from './features/admin/users/users.component';
import { AuditLogsComponent } from './features/admin/audit-logs/audit-logs.component';
import { CategoriesComponent } from './features/admin/categories/categories.component';
import { ProductsComponent } from './features/admin/products/products.component';
import { InventoryComponent } from './features/admin/inventory/inventory.component';
import { OrdersComponent } from './features/admin/orders/orders.component';
import { PaymentsComponent } from './features/admin/payments/payments.component';
import { ShipmentsComponent } from './features/admin/shipments/shipments.component';
import { CouponsComponent } from './features/admin/coupons/coupons.component';
import { ReviewsComponent } from './features/admin/reviews/reviews.component';
import { InventoryComponent as LogistiqueInventoryComponent } from './features/logistique/inventory/inventory.component';
import { OrdersComponent as LogistiqueOrdersComponent } from './features/logistique/orders/orders.component';
import { ShipmentsComponent as LogistiqueShipmentsComponent } from './features/logistique/shipments/shipments.component';
import { OrdersComponent as ComptabiliteOrdersComponent } from './features/comptabilite/orders/orders.component';
import { PaymentsComponent as ComptabilitePaymentsComponent } from './features/comptabilite/payments/payments.component';
import { CouponsComponent as ComptabiliteCouponsComponent } from './features/comptabilite/coupons/coupons.component';

import { LoginComponent } from './features/auth/login/login.component';
import { LogoutComponent } from './features/auth/logout/logout.component';
import { ErrorPageComponent } from './shared/components/error-page/error-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'logout',
    component: LogoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'LOGISTIQUE', 'COMPTABILITE'] },
  },
  { path: 'access-denied', component: ErrorPageComponent },
  { path: 'server-error', component: ErrorPageComponent, data: { reason: 'server' } },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'LOGISTIQUE', 'COMPTABILITE'] },
    children: [
      { path: 'dashboard', component: RoleDashboardRedirectComponent, canActivate: [permissionGuard], data: { permission: 'dashboard.view' } },
      {
        path: 'admin/dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard, permissionGuard],
        data: { roles: ['ADMIN'], permission: 'dashboard.view' },
      },
      {
        path: 'logistique/dashboard',
        component: LogistiqueDashboardComponent,
        canActivate: [roleGuard, permissionGuard],
        data: { roles: ['LOGISTIQUE'], permission: 'dashboard.view' },
      },
      {
        path: 'comptabilite/dashboard',
        component: ComptabiliteDashboardComponent,
        canActivate: [roleGuard, permissionGuard],
        data: { roles: ['COMPTABILITE'], permission: 'dashboard.view' },
      },
      { path: 'admin/users', component: UsersComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'users.read' } },
      { path: 'admin/audit-logs', component: AuditLogsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'auditLogs.read' } },
      { path: 'admin/categories', component: CategoriesComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'categories.read' } },
      { path: 'admin/products', component: ProductsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'products.read' } },
      { path: 'admin/inventory', component: InventoryComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'inventory.read' } },
      { path: 'admin/orders', component: OrdersComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'orders.read' } },
      { path: 'admin/payments', component: PaymentsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'payments.read' } },
      { path: 'admin/shipments', component: ShipmentsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'shipments.read' } },
      { path: 'admin/coupons', component: CouponsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'coupons.read' } },
      { path: 'admin/reviews', component: ReviewsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['ADMIN'], permission: 'reviews.read' } },

      { path: 'logistique/inventory', component: LogistiqueInventoryComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['LOGISTIQUE'], permission: 'inventory.read' } },
      { path: 'logistique/orders', component: LogistiqueOrdersComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['LOGISTIQUE'], permission: 'orders.read' } },
      { path: 'logistique/shipments', component: LogistiqueShipmentsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['LOGISTIQUE'], permission: 'shipments.read' } },

      { path: 'comptabilite/orders', component: ComptabiliteOrdersComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['COMPTABILITE'], permission: 'orders.read' } },
      { path: 'comptabilite/payments', component: ComptabilitePaymentsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['COMPTABILITE'], permission: 'payments.read' } },
      { path: 'comptabilite/coupons', component: ComptabiliteCouponsComponent, canActivate: [roleGuard, permissionGuard], data: { roles: ['COMPTABILITE'], permission: 'coupons.read' } },

      { path: 'users', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'users.read', feature: 'users' } },
      { path: 'audit-logs', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'auditLogs.read', feature: 'audit-logs' } },
      { path: 'categories', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'categories.read', feature: 'categories' } },
      { path: 'products', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'products.read', feature: 'products' } },
      { path: 'inventory', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'inventory.read', feature: 'inventory' } },
      { path: 'orders', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'orders.read', feature: 'orders' } },
      { path: 'payments', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'payments.read', feature: 'payments' } },
      { path: 'shipments', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'shipments.read', feature: 'shipments' } },
      { path: 'coupons', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'coupons.read', feature: 'coupons' } },
      { path: 'reviews', component: RoleFeatureRedirectComponent, canActivate: [permissionGuard], data: { permission: 'reviews.read', feature: 'reviews' } },
    ],
  },
  { path: '**', component: ErrorPageComponent, data: { reason: 'not-found' } },
];
