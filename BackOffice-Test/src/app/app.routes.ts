import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { permissionGuard } from './core/guards/permission.guard';

import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { LogistiqueDashboardComponent } from './features/logistique/dashboard/logistique-dashboard.component';
import { ComptabiliteDashboardComponent } from './features/comptabilite/dashboard/comptabilite-dashboard.component';
import { RoleDashboardRedirectComponent } from './features/common/role-dashboard-redirect/role-dashboard-redirect.component';
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
      { path: 'users', component: UsersComponent, canActivate: [permissionGuard], data: { permission: 'users.read' } },
      { path: 'audit-logs', component: AuditLogsComponent, canActivate: [permissionGuard], data: { permission: 'auditLogs.read' } },
      { path: 'categories', component: CategoriesComponent, canActivate: [permissionGuard], data: { permission: 'categories.read' } },
      { path: 'products', component: ProductsComponent, canActivate: [permissionGuard], data: { permission: 'products.read' } },
      { path: 'inventory', component: InventoryComponent, canActivate: [permissionGuard], data: { permission: 'inventory.read' } },
      { path: 'orders', component: OrdersComponent, canActivate: [permissionGuard], data: { permission: 'orders.read' } },
      { path: 'payments', component: PaymentsComponent, canActivate: [permissionGuard], data: { permission: 'payments.read' } },
      { path: 'shipments', component: ShipmentsComponent, canActivate: [permissionGuard], data: { permission: 'shipments.read' } },
      { path: 'coupons', component: CouponsComponent, canActivate: [permissionGuard], data: { permission: 'coupons.read' } },
      { path: 'reviews', component: ReviewsComponent, canActivate: [permissionGuard], data: { permission: 'reviews.read' } },
    ],
  },
  { path: '**', component: ErrorPageComponent, data: { reason: 'not-found' } },
];
