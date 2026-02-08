import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type Payload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminPaymentsService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/payments', params, true);
  }

  updateStatus(id: number, body: Payload) {
    return this.api.patch('/admin/payments/' + id + '/status', body);
  }
}

