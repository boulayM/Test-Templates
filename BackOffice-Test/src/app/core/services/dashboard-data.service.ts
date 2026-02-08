import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  constructor(private api: ApiService) {}

  getAdminMetrics(): Observable<unknown> {
    return forkJoin({
      users: this.api
        .get<unknown>('/admin/users', { page: 1, limit: 1 }, true)
        .pipe(catchError(() => of({ total: 0, data: [] }))),
      products: this.api
        .get<unknown>('/admin/products', { page: 1, limit: 1 }, true)
        .pipe(catchError(() => of({ total: 0, data: [] }))),
      orders: this.api
        .get<unknown>('/admin/orders', { page: 1, limit: 100 }, true)
        .pipe(catchError(() => of({ total: 0, data: [] }))),
    }).pipe(
      map(({ users, products, orders }) => {
        const usersTotal = this.extractTotal(users);
        const productsTotal = this.extractTotal(products);
        const orderRows = this.extractList(orders);

        const revenueCents = orderRows.reduce((sum, row) => {
          const val = typeof row['totalCents'] === 'number' ? row['totalCents'] : 0;
          return sum + val;
        }, 0);

        const ordersByStatus = orderRows.reduce<Record<string, number>>((acc, row) => {
          const st = typeof row['status'] === 'string' ? row['status'] : 'UNKNOWN';
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        }, {});

        return {
          orders: this.extractTotal(orders),
          users: usersTotal,
          products: productsTotal,
          revenueCents,
          ordersByStatus,
        };
      }),
    );
  }

  getUsersMetrics(): Observable<unknown> {
    return this.api.get<unknown>('/admin/users', { page: 1, limit: 100 }, true).pipe(
      map((res) => {
        const rows = this.extractList(res);
        const total = this.extractTotal(res);
        const verified = rows.filter((u) => u['emailVerified'] === true).length;
        const unverified = rows.filter((u) => u['emailVerified'] === false).length;
        return { total, verified, unverified };
      }),
    );
  }

  getProductsMetrics(): Observable<unknown> {
    return this.api.get<unknown>('/admin/products', { page: 1, limit: 100 }, true).pipe(
      map((res) => {
        const rows = this.extractList(res);
        const total = this.extractTotal(res);
        const active = rows.filter((p) => p['isActive'] === true).length;
        const inactive = rows.filter((p) => p['isActive'] === false).length;
        return { total, active, inactive };
      }),
    );
  }

  getOrdersMetrics(): Observable<unknown> {
    return this.api.get<unknown>('/admin/orders', { page: 1, limit: 100 }, true).pipe(
      map((res) => {
        const rows = this.extractList(res);
        const total = this.extractTotal(res);
        const byStatus = rows.reduce<Record<string, number>>((acc, row) => {
          const st = typeof row['status'] === 'string' ? row['status'] : 'UNKNOWN';
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        }, {});
        return { total, byStatus };
      }),
    );
  }

  getAuditMetrics(): Observable<unknown> {
    return this.api
      .get<unknown>('/admin/audit-logs', { page: 1, limit: 1 }, true)
      .pipe(map((res) => ({ total: this.extractTotal(res) })));
  }

  getRecentOrders(): Observable<unknown> {
    return this.api.get<unknown>('/admin/orders', { page: 1, limit: 5, sort: 'createdAt', order: 'desc' }, true);
  }

  getRecentUsers(): Observable<unknown> {
    return this.api.get<unknown>('/admin/users', { page: 1, limit: 5, sort: 'createdAt', order: 'desc' }, true);
  }

  getRecentLogs(): Observable<unknown> {
    return this.api.get<unknown>('/admin/audit-logs', { page: 1, limit: 5, sort: 'createdAt', order: 'desc' }, true);
  }

  private extractTotal(res: unknown): number {
    if (!res || typeof res !== 'object') return 0;
    const obj = res as Record<string, unknown>;
    if (typeof obj['total'] === 'number') return obj['total'];
    const body = obj['body'];
    if (body && typeof body === 'object') {
      const inner = body as Record<string, unknown>;
      if (typeof inner['total'] === 'number') return inner['total'];
    }
    return 0;
  }

  private extractList(res: unknown): Record<string, unknown>[] {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj['data'])) return obj['data'] as Record<string, unknown>[];
    const body = obj['body'];
    if (body && typeof body === 'object' && Array.isArray((body as Record<string, unknown>)['data'])) {
      return (body as Record<string, unknown>)['data'] as Record<string, unknown>[];
    }
    return [];
  }
}
