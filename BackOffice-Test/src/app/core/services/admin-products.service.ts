import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  constructor(private api: ApiService) {}

  list(params?: Record<string, string | number | boolean | null | undefined>) {
    return this.api.get('/admin/products', params);
  }

  create(body: Record<string, unknown>) {
    return this.api.post('/admin/products', body);
  }

  update(id: number, body: Record<string, unknown>) {
    return this.api.patch('/admin/products/' + id, body);
  }

  delete(id: number) {
    return this.api.deleteRequest('/admin/products/' + id);
  }
}
