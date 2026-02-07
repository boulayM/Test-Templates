import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type Payload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminInventoryService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/inventory', params, true);
  }

 create(body: Payload) {
    return this.api.post('/admin/inventory', body);
  }

  update(id: number, body: Payload) {
    return this.api.patch('/admin/inventory/' + id, body);
  }
}

