import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';

interface User {
  id: number;
  email: string;
  role: string;
}

interface OrderItem {
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
}

interface Order {
  id: number;
  userId: number;
  status: string;
  createdAt: string;
  currency?: string;
  subtotalCents?: number;
  totalCents?: number;
  items: OrderItem[];
}

interface AuditLog {
  id: string;
  action: string;
  userEmail?: string;
  userId?: number;
  createdAt?: string;
}

interface Metrics {
  orders: number;
  revenueCents: number;
  users: number;
  products: number;
  ordersByStatus: Record<string, number>;
}

interface UsersMetrics {
  total: number;
  verified: number;
  unverified: number;
}

interface ProductsMetrics {
  total: number;
  active: number;
  inactive: number;
}

interface OrdersMetrics {
  total: number;
  byStatus: Record<string, number>;
}

interface AuditMetrics {
  total: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  metrics: Metrics = { orders: 0, revenueCents: 0, users: 0, products: 0, ordersByStatus: {} };
  usersMetrics: UsersMetrics = { total: 0, verified: 0, unverified: 0 };
  productsMetrics: ProductsMetrics = { total: 0, active: 0, inactive: 0 };
  ordersMetrics: OrdersMetrics = { total: 0, byStatus: {} };
  auditMetrics: AuditMetrics = { total: 0 };

  recentOrders: Order[] = [];
  recentUsers: User[] = [];
  recentLogs: AuditLog[] = [];

  constructor(
    private dataService: DashboardDataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadMetrics();
    this.loadRecent();
    this.loadLogs();
  }

  private unwrapBody(res: unknown): unknown {
    if (res && typeof res === 'object' && 'body' in res) {
      const body = (res as { body?: unknown }).body;
      return body ?? res;
    }
    return res;
  }

  private unwrapRecord(res: unknown): Record<string, unknown> {
    const payload = this.unwrapBody(res);
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const obj = payload as Record<string, unknown>;
      const data = obj['data'];
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data as Record<string, unknown>;
      }
      return obj;
    }
    return {};
  }

  private unwrapList(res: unknown): unknown[] {
    const payload = this.unwrapBody(res);
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      const data = obj['data'];
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        const inner = data as Record<string, unknown>;
        const innerData = inner['data'];
        if (Array.isArray(innerData)) return innerData;
      }
      const orders = obj['orders'];
      if (Array.isArray(orders)) return orders;
      const users = obj['users'];
      if (Array.isArray(users)) return users;
      const logs = obj['logs'];
      if (Array.isArray(logs)) return logs;
    }
    return [];
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' ? value : 0;
  }

  private toRecordNumber(value: unknown): Record<string, number> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const out: Record<string, number> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (typeof val === 'number') out[key] = val;
      }
      return out;
    }
    return {};
  }

  private toUsersMetrics(res: unknown): UsersMetrics {
    const obj = this.unwrapRecord(res);
    return {
      total: this.toNumber(obj['total']),
      verified: this.toNumber(obj['verified']),
      unverified: this.toNumber(obj['unverified']),
    };
  }

  private toProductsMetrics(res: unknown): ProductsMetrics {
    const obj = this.unwrapRecord(res);
    return {
      total: this.toNumber(obj['total']),
      active: this.toNumber(obj['active']),
      inactive: this.toNumber(obj['inactive']),
    };
  }

  private toOrdersMetrics(res: unknown): OrdersMetrics {
    const obj = this.unwrapRecord(res);
    return {
      total: this.toNumber(obj['total']),
      byStatus: this.toRecordNumber(obj['byStatus']),
    };
  }

  private toAuditMetrics(res: unknown): AuditMetrics {
    const obj = this.unwrapRecord(res);
    return { total: this.toNumber(obj['total']) };
  }

  centsToEuros(value: unknown): string {
    const cents = Number(value || 0);
    const euros = cents / 100;
    return euros.toFixed(2);
  }

  formatDate(value: string | number | Date | null | undefined) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value).toLocaleDateString();
    }
    return '';
  }

  get statusList() {
    const map = this.metrics.ordersByStatus || this.ordersMetrics.byStatus || {};
    return Object.keys(map).map((status) => ({ status, count: map[status] }));
  }

  get alerts() {
    const list: string[] = [];
    const pending =
      this.metrics.ordersByStatus['PENDING'] ?? this.ordersMetrics.byStatus['PENDING'] ?? 0;
    const inactive = this.productsMetrics.inactive ?? 0;
    const unverified = this.usersMetrics.unverified ?? 0;

    if (pending > 0) list.push(`${pending} orders pending`);
    if (inactive > 0) list.push(`${inactive} products inactive`);
    if (unverified > 0) list.push(`${unverified} users unverified`);
    return list;
  }

  loadMetrics() {
    forkJoin([
      this.dataService.getAdminMetrics().pipe(catchError(() => of({}))),
      this.dataService.getUsersMetrics().pipe(catchError(() => of({ total: 0, verified: 0, unverified: 0 }))),
      this.dataService.getProductsMetrics().pipe(catchError(() => of({ total: 0, active: 0, inactive: 0 }))),
      this.dataService.getOrdersMetrics().pipe(catchError(() => of({ total: 0, byStatus: {} }))),
      this.dataService.getAuditMetrics().pipe(catchError(() => of({ total: 0 }))),
    ]).subscribe(([adminRes, usersRes, productsRes, ordersRes, auditRes]: unknown[]) => {
      const admin = this.unwrapRecord(adminRes);
      this.metrics.orders = this.toNumber(admin['orders']);
      this.metrics.users = this.toNumber(admin['users']);
      this.metrics.products = this.toNumber(admin['products']);
      this.metrics.revenueCents = this.toNumber(admin['revenueCents']);
      this.metrics.ordersByStatus = this.toRecordNumber(admin['ordersByStatus']);

      this.usersMetrics = this.toUsersMetrics(usersRes);
      this.productsMetrics = this.toProductsMetrics(productsRes);
      this.ordersMetrics = this.toOrdersMetrics(ordersRes);
      this.auditMetrics = this.toAuditMetrics(auditRes);
      this.cdr.detectChanges();
    });
  }

  loadRecent() {
    forkJoin([
      this.dataService.getRecentOrders().pipe(catchError(() => of({ data: [] }))),
      this.dataService.getRecentUsers().pipe(catchError(() => of({ data: [] }))),
    ]).subscribe(
      ([ordersRes, usersRes]: unknown[]) => {
        this.recentOrders = this.unwrapList(ordersRes) as Order[];
        this.recentUsers = this.unwrapList(usersRes) as User[];
        this.cdr.detectChanges();
      },
    );
  }

  loadLogs() {
    this.dataService
      .getRecentLogs()
      .pipe(catchError(() => of({ data: [] })))
      .subscribe((res: unknown) => {
      this.recentLogs = this.unwrapList(res) as AuditLog[];
      this.cdr.detectChanges();
    });
  }
}
