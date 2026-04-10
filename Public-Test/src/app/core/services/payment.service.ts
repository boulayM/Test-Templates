import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { PaymentSummary } from '../../shared/models/order.model';

type ProviderStatus =
  | { providerEnabled: true; providers: string[] }
  | { code: string; message: string };

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private api = inject(ApiService);

  getPaymentsByOrder(orderId: number): Observable<PaymentSummary[]> {
    return this.api
      .get<{ data: PaymentSummary[] }>(`/public/payments/${orderId}`)
      .pipe(map((res) => res.data || []));
  }

  getProviderStatus(): Observable<ProviderStatus> {
    return this.api.get<ProviderStatus>('/public/payments/providers/status');
  }
}
