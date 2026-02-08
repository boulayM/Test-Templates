import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminAuditLogsService } from '../../../core/services/admin-audit-logs.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

interface AuditActor {
  id?: number;
  email?: string | null;
  role?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

interface AuditTarget {
  type?: string | null;
  id?: string | null;
  label?: string | null;
}

interface AuditLogItem {
  id?: string;
  _id?: string;
  action?: string | null;
  status?: string | null;
  requestId?: string | null;
  userId?: number | null;
  userEmail?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt?: string | null;
  actor?: AuditActor | null;
  target?: AuditTarget | null;
  changes?: unknown;
  metadata?: unknown;
}

interface AuditLogsListResponse {
  data: AuditLogItem[];
  total: number;
  page?: number;
  limit?: number;
}

@Component({
  selector: 'app-audit-logs',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css'],
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLogItem[] = [];
  total = 0;
  page = 1;
  limit = 10;
  totalPages = 1;

  q = '';
  actionFilter = '';
  statusFilter = '';
  actorEmail = '';
  targetType = '';

  selected: AuditLogItem | null = null;

  readonly actions = [
    'LOGIN',
    'LOGOUT',
    'LOGIN_FAIL',
    'LOGIN_BLOCKED',
    'ACCESS_DENIED',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DELETE',
    'ORDER_CREATE',
    'ORDER_UPDATE',
    'PAYMENT_CREATE',
    'PAYMENT_UPDATE',
    'SHIPMENT_CREATE',
    'SHIPMENT_UPDATE',
    'VERIFY_EMAIL',
    'REGISTER',
  ];

  readonly statuses = ['DENIED', 'FAILED', 'SUCCESS'];

  constructor(
    private auditLogsService: AdminAuditLogsService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get canExport(): boolean {
    return this.auth.isAdmin;
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  private buildFiltersParam(): string | undefined {
    const obj: Record<string, string> = {};
    if (this.actionFilter) obj['action'] = this.actionFilter;
    if (this.statusFilter) obj['status'] = this.statusFilter;
    if (this.actorEmail.trim()) obj['actorEmail'] = this.actorEmail.trim();
    if (this.targetType.trim()) obj['targetType'] = this.targetType.trim();
    return Object.keys(obj).length > 0 ? JSON.stringify(obj) : undefined;
  }

  private unwrapBody(
    res: AuditLogsListResponse | { body?: AuditLogsListResponse } | unknown,
  ): AuditLogsListResponse | unknown {
    if (res && typeof res === 'object' && 'body' in res) {
      const r = res as { body?: AuditLogsListResponse };
      if (r.body) return r.body;
    }
    return res;
  }

  private extractList(res: AuditLogsListResponse | unknown): AuditLogItem[] {
    if (!res) return [];
    if (Array.isArray(res)) return res as AuditLogItem[];
    if (res && typeof res === 'object' && 'data' in res) {
      const r = res as { data?: unknown; logs?: unknown; items?: unknown };
      if (Array.isArray(r.data)) return r.data as AuditLogItem[];
      if (Array.isArray(r.logs)) return r.logs as AuditLogItem[];
      if (Array.isArray(r.items)) return r.items as AuditLogItem[];
      if (r.data && typeof r.data === 'object' && 'data' in (r.data as object)) {
        const inner = r.data as { data?: unknown };
        if (Array.isArray(inner.data)) return inner.data as AuditLogItem[];
      }
    }
    return [];
  }

  private extractTotal(res: AuditLogsListResponse | unknown): number {
    if (!res) return 0;
    if (res && typeof res === 'object' && 'total' in res) {
      const r = res as { total?: unknown; data?: unknown };
      if (typeof r.total === 'number') return r.total;
      if (r.data && typeof r.data === 'object' && 'total' in (r.data as object)) {
        const inner = r.data as { total?: unknown };
        if (typeof inner.total === 'number') return inner.total;
      }
    }
    return 0;
  }

  private extractErrorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') return 'Operation failed';
    const e = err as { error?: { message?: string; details?: string }; message?: string };
    return e.error?.message || e.error?.details || e.message || 'Operation failed';
  }

  private buildListParams(): Record<string, string | number | boolean | null | undefined> {
    const filtersParam = this.buildFiltersParam();
    const params: Record<string, string | number | boolean | null | undefined> = {
      page: this.page,
      limit: this.limit,
      q: this.q.trim(),
      sort: 'createdAt',
      order: 'desc',
    };
    if (filtersParam) params['filters'] = filtersParam;
    return params;
  }

  load(): void {
    const params = this.buildListParams();

    this.auditLogsService.list(params).subscribe({
      next: (res: AuditLogsListResponse | { body?: AuditLogsListResponse } | unknown) => {
        const body = this.unwrapBody(res);
        const raw = this.extractList(body);
        this.logs = raw.map((l) => {
          const id = l && (l.id || l._id);
          return id ? { ...l, id } : l;
        });
        this.total = this.extractTotal(body);
        this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.toast.error(this.extractErrorMessage(err));
      },
    });
  }

  selectLog(log: AuditLogItem): void {
    this.selected = log;
    setTimeout(() => {
      const target = document.getElementById('audit-details');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page -= 1;
    this.load();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page += 1;
    this.load();
  }

  formatDate(value: string | number | Date | null | undefined): string {
    if (value === null || value === undefined) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  }

  getStatus(log: AuditLogItem): string {
    if (log.status) return log.status;
    const metadataStatus = this.extractMetadataField(log.metadata, 'status');
    return metadataStatus || '-';
  }

  getRequestId(log: AuditLogItem): string {
    if (log.requestId) return log.requestId;
    const metadataRequestId = this.extractMetadataField(log.metadata, 'requestId');
    return metadataRequestId || '-';
  }

  private extractMetadataField(metadata: unknown, field: string): string {
    if (!metadata || typeof metadata !== 'object') return '';
    const obj = metadata as Record<string, unknown>;
    const value = obj[field];
    return typeof value === 'string' ? value : '';
  }

  pretty(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2) || '';
    } catch {
      return '';
    }
  }

  exportCsv(): void {
    if (!this.canExport) {
      this.toast.error('Export CSV is allowed for ADMIN only');
      return;
    }

    this.auditLogsService.exportCsv(this.buildListParams()).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit-logs.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success('CSV exported');
      },
      error: (err: unknown) => {
        this.toast.error(this.extractErrorMessage(err));
      },
    });
  }
}
