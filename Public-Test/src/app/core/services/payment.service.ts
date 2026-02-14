import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Payment } from '../../shared/models/order.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private api: ApiService) {}

  getProviderStatus(): Observable<{ enabled: boolean; code?: string; message?: string }> {
    return this.api.get('/public/payments/providers/status').pipe(
      map(() => ({ enabled: true })),
    );
  }

  getOrderPayments(orderId: number): Observable<Payment[]> {
    return this.api
      .get<{ data: Payment[] }>(`/public/payments/${orderId}`)
      .pipe(map((res) => res.data || []));
  }

  createPayment(input: {
    orderId: number;
    provider: 'STRIPE' | 'PAYPAL' | 'MANUAL';
  }): Observable<Payment> {
    return this.api
      .post<{ payment: Payment }>('/public/payments', input)
      .pipe(map((res) => res.payment));
  }
}
