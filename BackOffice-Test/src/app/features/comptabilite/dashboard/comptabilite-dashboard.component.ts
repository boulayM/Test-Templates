import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { catchError, forkJoin, of } from 'rxjs';
import { DashboardGridComponent } from '../../../shared/dashboard/components/dashboard-grid/dashboard-grid.component';
import { KpiCardComponent } from '../../../shared/widgets/kpi-card/kpi-card.component';

@Component({
  selector: 'app-comptabilite-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardGridComponent, KpiCardComponent],
  templateUrl: './comptabilite-dashboard.component.html',
  styleUrl: './comptabilite-dashboard.component.scss',
})
export class ComptabiliteDashboardComponent implements OnInit {
  ordersTotal = 0;
  revenueCents = 0;
  paymentsCaptured = 0;
  paymentsFailed = 0;
  paymentsRefunded = 0;
  couponsUsed = 0;

  constructor(
    private dataService: DashboardDataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.dataService.getAdminMetrics().pipe(catchError(() => of({ orders: 0, revenueCents: 0 }))),
      this.dataService.getPaymentsMetrics().pipe(catchError(() => of({ byStatus: {} }))),
      this.dataService.getCouponsMetrics().pipe(catchError(() => of({ usedCount: 0 }))),
    ]).subscribe(([admin, payments, coupons]) => {
      const a = admin as { orders?: number; revenueCents?: number };
      const p = payments as { byStatus?: Record<string, number> };
      const c = coupons as { usedCount?: number };

      this.ordersTotal = a.orders || 0;
      this.revenueCents = a.revenueCents || 0;
      this.paymentsCaptured = p.byStatus?.CAPTURED || 0;
      this.paymentsFailed = p.byStatus?.FAILED || 0;
      this.paymentsRefunded = p.byStatus?.REFUNDED || 0;
      this.couponsUsed = c.usedCount || 0;
      this.cdr.detectChanges();
    });
  }

  centsToEuros(value: unknown): string {
    const cents = Number(value || 0);
    return (cents / 100).toFixed(2);
  }
}
