import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type Payload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminShipmentsService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/shipments', params, true);
  }

  create(body: Payload) {
    return this.api.post('/admin/shipments', body);
  }

  update(id: number, body: Payload) {
    return this.api.patch('/admin/shipments/' + id, body);
  }

  delete(id: number) {
    return this.api.deleteRequest('/admin/shipments/' + id);
  }
}

