import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { Order, ShipmentSummary } from '../../shared/models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = inject(ApiService);

  getMyOrders(): Observable<Order[]> {
    return this.api
      .get<{ data: Order[] }>('/public/orders')
      .pipe(map((res) => res.data || []));
  }

  getMyOrder(orderId: number): Observable<Order> {
    return this.api
      .get<{ order: Order }>(`/public/orders/${orderId}`)
      .pipe(map((res) => res.order));
  }

  getMyOrderShipments(orderId: number): Observable<ShipmentSummary[]> {
    return this.api
      .get<{ data: ShipmentSummary[] }>(`/public/orders/${orderId}/shipments`)
      .pipe(map((res) => res.data || []));
  }

  createOrder(payload: {
    shippingAddressId: number;
    billingAddressId: number;
    couponCode?: string;
  }): Observable<Order> {
    return this.api
      .post<{ order: Order }>('/public/orders', payload)
      .pipe(map((res) => res.order));
  }
}
