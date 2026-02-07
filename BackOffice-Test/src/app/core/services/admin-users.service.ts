import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type Payload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/users', params, true);
  }

  create(body: Payload) {
    return this.api.post('/admin/users/register', body);
  }

  update(id: number, body: Payload) {
    return this.api.patch('/admin/users/' + id, body);
  }

  delete(id: number) {
    return this.api.deleteRequest('/admin/users/' + id);
  }

  exportCsv(params?: QueryParams) {
    return this.api.getBlob('/admin/users/export', params, true);
  }
}

