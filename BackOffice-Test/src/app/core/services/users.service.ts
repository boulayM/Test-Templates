import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private api: ApiService) {}

  list(params?: Record<string, string | number | boolean | null | undefined>) {
    return this.api.get('/users', params, true);
  }
  create(body: Record<string, unknown>) {
    return this.api.post('/users/register', body);
  }
  update(id: number, body: Record<string, unknown>) {
    return this.api.patch('/users/' + id, body);
  }
  delete(id: number) {
    return this.api.deleteRequest('/users/' + id);
  }
  exportCsv() {
    return this.api.getBlob('/users/export', undefined, true);
  }
}