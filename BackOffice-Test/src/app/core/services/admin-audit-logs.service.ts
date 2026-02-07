import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class AdminAuditLogsService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/audit-logs', params, true);
  }

  getById(id: string) {
    return this.api.get('/admin/audit-logs/' + id, undefined, true);
  }

  exportCsv(params?: QueryParams) {
    return this.api.getBlob('/admin/audit-logs/export', params, true);
  }
}

