import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CouponService {
  constructor(private api: ApiService) {}

  validateCoupon(
    code: string,
    orderTotalCents?: number,
  ): Observable<{ valid: boolean; reason?: string; discountCents?: number; coupon?: unknown }> {
    const params = new URLSearchParams();
    params.set('code', code);
    if (orderTotalCents !== undefined) {
      params.set('orderTotalCents', String(orderTotalCents));
    }
    return this.api
      .get<{ valid: boolean; reason?: string; discountCents?: number; coupon?: unknown }>(
        `/public/coupons/validate?${params.toString()}`,
      )
      .pipe(
        map((res) => ({
          valid: !!res.valid,
          reason: res.reason,
          discountCents: res.discountCents,
          coupon: res.coupon,
        })),
      );
  }
}
