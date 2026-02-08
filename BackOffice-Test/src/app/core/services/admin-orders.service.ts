import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type Payload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/orders', params, true);
  }

  getById(id: number) {
    return this.api.get('/admin/orders/' + id, undefined, true);
  }

  updateStatus(id: number, body: Payload) {
    return this.api.patch('/admin/orders/' + id + '/status', body);
  }
}

