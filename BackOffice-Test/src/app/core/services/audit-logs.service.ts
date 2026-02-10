import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  constructor(private api: ApiService) {}

  list(params?: Record<string, string | number | boolean | null | undefined>) {
    return this.api.get('/admin/audit-logs', params);
  }
  exportCsv() {
    return this.api.getBlob('/admin/audit-logs/export');
  }
}