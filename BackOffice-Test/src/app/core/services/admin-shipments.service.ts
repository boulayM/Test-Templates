import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdminShipmentsService {
  constructor(private api: ApiService) {}

  list(params?: Record<string, string | number | boolean | null | undefined>) {
    return this.api.get('/admin/shipments', params, true);
  }

  updateStatus(id: number, status: string) {
    return this.api.patch('/admin/shipments/' + id, { status });
  }
}