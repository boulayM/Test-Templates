import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type Payload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/products', params, true);
  }

  create(body: Payload) {
    return this.api.post('/admin/products', body);
  }

  update(id: number, body: Payload) {
    return this.api.patch('/admin/products/' + id, body);
  }

  delete(id: number) {
    return this.api.deleteRequest('/admin/products/' + id);
  }
}

