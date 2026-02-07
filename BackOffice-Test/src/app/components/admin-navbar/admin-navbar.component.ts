import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.scss',
})
export class AdminNavbarComponent {
  user = computed(() => this.auth.user);
  isLoggedIn = computed(() => !!this.auth.user);
  role = computed(() => this.auth.user?.role ?? null);
  canSeeUsers = computed(() => this.role() === 'ADMIN');
  canSeeAuditLogs = computed(() => {
    const role = this.role();
    return role === 'ADMIN' || role === 'LOGISTIQUE' || role === 'COMPTABILITE';
  });
  canSeeCatalog = computed(() => this.role() === 'ADMIN');
  canSeeInventory = computed(() => {
    const role = this.role();
    return role === 'ADMIN' || role === 'LOGISTIQUE';
  });
  canSeeOrders = computed(() => {
    const role = this.role();
    return role === 'ADMIN' || role === 'LOGISTIQUE';
  });
  canSeePayments = computed(() => {
    const role = this.role();
    return role === 'ADMIN' || role === 'COMPTABILITE';
  });
  canSeeShipments = computed(() => {
    const role = this.role();
    return role === 'ADMIN' || role === 'LOGISTIQUE';
  });
  canSeeCoupons = computed(() => {
    const role = this.role();
    return role === 'ADMIN' || role === 'COMPTABILITE';
  });
  canSeeReviews = computed(() => this.role() === 'ADMIN');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async handleLogout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
