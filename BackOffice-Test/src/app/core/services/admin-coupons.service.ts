import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminCouponsService {
  constructor(private api: ApiService) {}

  list(params?: Record<string, string | number | boolean | null | undefined>) {
    return this.api.get('/admin/coupons', params, true);
  }

  create(body: Record<string, unknown>) {
    return this.api.post('/admin/coupons', body);
  }
}