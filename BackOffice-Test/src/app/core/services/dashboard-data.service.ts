import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  getAdminMetrics(): Observable<unknown> {
    return of({
      orders: 12,
      users: 5,
      products: 0,
      revenueCents: 125000,
      ordersByStatus: { PENDING: 2, PAID: 8, CANCELLED: 2 },
    });
  }

  getUsersMetrics(): Observable<unknown> {
    return of({ total: 5, verified: 3, unverified: 2 });
  }

  getProductsMetrics(): Observable<unknown> {
    return of({ total: 0, active: 0, inactive: 0 });
  }

  getOrdersMetrics(): Observable<unknown> {
    return of({ total: 12, byStatus: { PENDING: 2, PAID: 8, CANCELLED: 2 } });
  }

  getAuditMetrics(): Observable<unknown> {
    return of({ total: 20 });
  }

  getRecentOrders(): Observable<unknown> {
    return of({
      data: [
        {
          id: 1,
          userId: 1,
          status: 'PAID',
          createdAt: new Date().toISOString(),
          totalCents: 4999,
          items: [],
        },
      ],
    });
  }

  getRecentUsers(): Observable<unknown> {
    return of({
      data: [
        { id: 1, email: 'admin@test.local', role: 'ADMIN' },
        { id: 2, email: 'user@test.local', role: 'USER' },
      ],
    });
  }

  getRecentLogs(): Observable<unknown> {
    return of({
      data: [
        { id: '1', action: 'LOGIN', userEmail: 'admin@test.local', createdAt: new Date().toISOString() },
      ],
    });
  }
}