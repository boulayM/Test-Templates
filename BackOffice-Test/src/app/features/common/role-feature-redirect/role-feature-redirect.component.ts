import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type FeatureKey =
  | 'users'
  | 'audit-logs'
  | 'categories'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'payments'
  | 'shipments'
  | 'coupons'
  | 'reviews';

@Component({
  selector: 'app-role-feature-redirect',
  standalone: true,
  template: '',
})
export class RoleFeatureRedirectComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const feature = (this.route.snapshot.data['feature'] || '') as FeatureKey;
    const role = this.auth.user?.role;

    const target = this.resolveTarget(role, feature);
    if (target) {
      this.router.navigate([target]);
      return;
    }

    this.router.navigate(['/access-denied'], {
      queryParams: { reason: 'role-feature', feature },
    });
  }

  private resolveTarget(role: string | undefined, feature: FeatureKey): string | null {
    switch (feature) {
      case 'users':
      case 'audit-logs':
      case 'categories':
      case 'products':
      case 'reviews':
        return role === 'ADMIN' ? `/admin/${feature}` : null;

      case 'inventory':
        if (role === 'ADMIN') return '/admin/inventory';
        if (role === 'LOGISTIQUE') return '/logistique/inventory';
        return null;

      case 'orders':
        if (role === 'ADMIN') return '/admin/orders';
        if (role === 'LOGISTIQUE') return '/logistique/orders';
        if (role === 'COMPTABILITE') return '/comptabilite/orders';
        return null;

      case 'payments':
        if (role === 'ADMIN') return '/admin/payments';
        if (role === 'COMPTABILITE') return '/comptabilite/payments';
        return null;

      case 'shipments':
        if (role === 'ADMIN') return '/admin/shipments';
        if (role === 'LOGISTIQUE') return '/logistique/shipments';
        return null;

      case 'coupons':
        if (role === 'ADMIN') return '/admin/coupons';
        if (role === 'COMPTABILITE') return '/comptabilite/coupons';
        return null;

      default:
        return null;
    }
  }
}