import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { OrderRecord, Shipment } from '../../shared/models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService) {}

  listMyOrders(page = 1, limit = 20): Observable<OrderRecord[]> {
    return this.api
      .get<{ data: OrderRecord[] }>(`/public/orders?page=${page}&limit=${limit}`)
      .pipe(map((res) => res.data || []));
  }

  getMyOrder(orderId: number): Observable<OrderRecord> {
    return this.api
      .get<{ order: OrderRecord }>(`/public/orders/${orderId}`)
      .pipe(map((res) => res.order));
  }

  createOrder(input: {
    shippingAddressId: number;
    billingAddressId: number;
    couponCode?: string;
  }): Observable<OrderRecord> {
    return this.api
      .post<{ order: OrderRecord }>('/public/orders', input)
      .pipe(map((res) => res.order));
  }

  getOrderShipments(orderId: number): Observable<Shipment[]> {
    return this.api
      .get<{ data: Shipment[] }>(`/public/orders/${orderId}/shipments`)
      .pipe(map((res) => res.data || []));
  }
}
