import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  constructor(private api: ApiService) {}

  list(params?: Record<string, string | number | boolean | null | undefined>) {
    return this.api.get('/admin/categories', params);
  }

  create(body: Record<string, unknown>) {
    return this.api.post('/admin/categories', body);
  }

  update(id: number, body: Record<string, unknown>) {
    return this.api.patch('/admin/categories/' + id, body);
  }

  delete(id: number) {
    return this.api.deleteRequest('/admin/categories/' + id);
  }
}
