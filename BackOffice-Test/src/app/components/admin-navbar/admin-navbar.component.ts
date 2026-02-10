import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppPermission, hasPermission } from '../../core/permissions/permission-map';

@Component({
  selector: 'app-admin-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.scss',
})
export class AdminNavbarComponent {
  user = computed(() => this.auth.user);
  isLoggedIn = computed(() => !!this.auth.user);
  dashboardPath = computed(() => {
    const role = this.auth.user?.role;
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'LOGISTIQUE') return '/logistique/dashboard';
    if (role === 'COMPTABILITE') return '/comptabilite/dashboard';
    return '/dashboard';
  });

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  can(permission: AppPermission): boolean {
    return hasPermission(this.auth.user?.role, permission);
  }

  pathFor(permission: AppPermission): string {
    const role = this.auth.user?.role;
    if (permission === 'users.read') return '/admin/users';
    if (permission === 'auditLogs.read') return '/admin/audit-logs';
    if (permission === 'categories.read') return '/admin/categories';
    if (permission === 'products.read') return '/admin/products';
    if (permission === 'reviews.read') return '/admin/reviews';

    if (permission === 'inventory.read') {
      return role === 'LOGISTIQUE' ? '/logistique/inventory' : '/admin/inventory';
    }
    if (permission === 'shipments.read') {
      return role === 'LOGISTIQUE' ? '/logistique/shipments' : '/admin/shipments';
    }
    if (permission === 'payments.read') {
      return role === 'COMPTABILITE' ? '/comptabilite/payments' : '/admin/payments';
    }
    if (permission === 'coupons.read') {
      return role === 'COMPTABILITE' ? '/comptabilite/coupons' : '/admin/coupons';
    }
    if (permission === 'orders.read') {
      if (role === 'LOGISTIQUE') return '/logistique/orders';
      if (role === 'COMPTABILITE') return '/comptabilite/orders';
      return '/admin/orders';
    }

    return '/dashboard';
  }

  async handleLogout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
