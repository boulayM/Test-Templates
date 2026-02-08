import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { UsersComponent } from './features/admin/users/users.component';
import { AuditLogsComponent } from './features/admin/audit-logs/audit-logs.component';
import { CategoriesComponent } from './features/admin/categories/categories.component';
import { ProductsComponent } from './features/admin/products/products.component';
import { ImagesComponent } from './features/admin/images/images.component';
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
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'LOGISTIQUE', 'COMPTABILITE'] },
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'audit-logs',
        component: AuditLogsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'LOGISTIQUE', 'COMPTABILITE'] },
      },
      {
        path: 'categories',
        component: CategoriesComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'products',
        component: ProductsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'images',
        component: ImagesComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'inventory',
        component: InventoryComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'LOGISTIQUE'] },
      },
      {
        path: 'orders',
        component: OrdersComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'LOGISTIQUE'] },
      },
      {
        path: 'payments',
        component: PaymentsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'COMPTABILITE'] },
      },
      {
        path: 'shipments',
        component: ShipmentsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'LOGISTIQUE'] },
      },
      {
        path: 'coupons',
        component: CouponsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'COMPTABILITE'] },
      },
      {
        path: 'reviews',
        component: ReviewsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
    ],
  },
  { path: '**', component: ErrorPageComponent, data: { reason: 'not-found' } },
];
