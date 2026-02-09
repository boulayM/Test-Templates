import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { catchError, forkJoin, of } from 'rxjs';
import { DashboardGridComponent } from '../../../shared/dashboard/components/dashboard-grid/dashboard-grid.component';
import { KpiCardComponent } from '../../../shared/widgets/kpi-card/kpi-card.component';
import { RecentListComponent } from '../../../shared/widgets/recent-list/recent-list.component';

@Component({
  selector: 'app-logistique-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DashboardGridComponent, KpiCardComponent, RecentListComponent],
  templateUrl: './logistique-dashboard.component.html',
  styleUrl: './logistique-dashboard.component.scss',
})
export class LogistiqueDashboardComponent implements OnInit {
  ordersTotal = 0;
  shipmentsTotal = 0;
  inventoryLow = 0;
  inventoryOut = 0;
  pendingPrep = 0;
  recentOrders: Array<{ id: number; status: string; totalCents?: number }> = [];

  constructor(
    private dataService: DashboardDataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.dataService.getOrdersMetrics().pipe(catchError(() => of({ total: 0, byStatus: {} }))),
      this.dataService.getShipmentsMetrics().pipe(catchError(() => of({ total: 0, byStatus: {} }))),
      this.dataService.getInventoryMetrics().pipe(catchError(() => of({ total: 0, outOfStock: 0, lowStock: 0 }))),
      this.dataService.getRecentOrders().pipe(catchError(() => of({ data: [] }))),
    ]).subscribe(([orders, shipments, inventory, recent]) => {
      const o = orders as { total?: number; byStatus?: Record<string, number> };
      const s = shipments as { total?: number };
      const i = inventory as { outOfStock?: number; lowStock?: number };
      const r = recent as { data?: Array<{ id: number; status: string; totalCents?: number }> };

      this.ordersTotal = o.total || 0;
      this.pendingPrep = o.byStatus?.PAID || 0;
      this.shipmentsTotal = s.total || 0;
      this.inventoryOut = i.outOfStock || 0;
      this.inventoryLow = i.lowStock || 0;
      this.recentOrders = Array.isArray(r.data) ? r.data : [];
      this.cdr.detectChanges();
    });
  }

  centsToEuros(value: unknown): string {
    const cents = Number(value || 0);
    return (cents / 100).toFixed(2);
  }
}
