import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  constructor(private api: ApiService) {}

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
    return {};
  }

  private asArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const data = (value as Record<string, unknown>)['data'];
      if (Array.isArray(data)) return data;
    }
    return [];
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' ? value : 0;
  }

  getAdminMetrics(): Observable<unknown> {
    return this.api
      .get<unknown>('/admin/orders', { page: 1, limit: 100 })
      .pipe(
        map((res) => {
          const rec = this.asRecord(res);
          const total = this.toNumber(rec['total']);
          const rows = this.asArray(rec['data']);
          let revenueCents = 0;
          const byStatus: Record<string, number> = {};

          for (const row of rows) {
            const r = this.asRecord(row);
            const status = typeof r['status'] === 'string' ? r['status'] : 'UNKNOWN';
            const totalCents = this.toNumber(r['totalCents']);
            revenueCents += totalCents;
            byStatus[status] = (byStatus[status] || 0) + 1;
          }

          return {
            orders: total,
            users: 0,
            products: 0,
            revenueCents,
            ordersByStatus: byStatus,
          };
        }),
      );
  }

  getUsersMetrics(): Observable<unknown> {
    return this.api
      .get<unknown>('/users', { page: 1, limit: 100, sort: 'createdAt', order: 'desc' }, true)
      .pipe(
        map((res) => {
          const rec = this.asRecord(res);
          const data = this.asArray(rec['data']);
          let verified = 0;
          let unverified = 0;
          for (const row of data) {
            const r = this.asRecord(row);
            if (r['emailVerified'] === true) verified += 1;
            else unverified += 1;
          }
          return {
            total: this.toNumber(rec['total']) || data.length,
            verified,
            unverified,
          };
        }),
      );
  }

  getProductsMetrics(): Observable<unknown> {
    return this.api
      .get<unknown>('/admin/products', { page: 1, limit: 100, sort: 'id', order: 'desc' }, true)
      .pipe(
        map((res) => {
          const rec = this.asRecord(res);
          const data = this.asArray(rec['data']);
          let active = 0;
          let inactive = 0;
          for (const row of data) {
            const r = this.asRecord(row);
            if (r['isActive'] === true) active += 1;
            else inactive += 1;
          }
          return {
            total: this.toNumber(rec['total']) || data.length,
            active,
            inactive,
          };
        }),
      );
  }

  getOrdersMetrics(): Observable<unknown> {
    return this.api
      .get<unknown>('/admin/orders', { page: 1, limit: 100 })
      .pipe(
        map((res) => {
          const rec = this.asRecord(res);
          const data = this.asArray(rec['data']);
          const byStatus: Record<string, number> = {};
          for (const row of data) {
            const r = this.asRecord(row);
            const status = typeof r['status'] === 'string' ? r['status'] : 'UNKNOWN';
            byStatus[status] = (byStatus[status] || 0) + 1;
          }
          return {
            total: this.toNumber(rec['total']) || data.length,
            byStatus,
          };
        }),
      );
  }

  getAuditMetrics(): Observable<unknown> {
    return this.api
      .get<unknown>('/audit-logs', { page: 1, limit: 1, sort: 'createdAt', order: 'desc' }, true)
      .pipe(
        map((res) => {
          const rec = this.asRecord(res);
          return { total: this.toNumber(rec['total']) };
        }),
      );
  }

  getRecentOrders(): Observable<unknown> {
    return this.api.get<unknown>('/admin/orders', { page: 1, limit: 5 });
  }

  getRecentUsers(): Observable<unknown> {
    return this.api.get<unknown>('/users', { page: 1, limit: 5, sort: 'createdAt', order: 'desc' }, true);
  }

  getRecentLogs(): Observable<unknown> {
    return this.api.get<unknown>('/audit-logs', { page: 1, limit: 5, sort: 'createdAt', order: 'desc' }, true);
  }
}
