import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogsService } from '../../../core/services/audit-logs.service';
import { ToastService } from '../../../shared/services/toast.service';

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
  styleUrls: ['./audit-logs.component.css']
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

  constructor(
    private auditLogsService: AuditLogsService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  private buildFiltersParam(): string | undefined {
    const obj: Record<string, string> = {};
    if (this.actionFilter) obj['action'] = this.actionFilter;
    if (this.statusFilter) obj['status'] = this.statusFilter;
    if (this.actorEmail) obj['actorEmail'] = this.actorEmail;
    if (this.targetType) obj['targetType'] = this.targetType;
    return Object.keys(obj).length > 0 ? JSON.stringify(obj) : undefined;
  }

  private unwrapBody(res: AuditLogsListResponse | { body?: AuditLogsListResponse } | unknown): AuditLogsListResponse | unknown {
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

  load(): void {
    const filtersParam = this.buildFiltersParam();
    const params: Record<string, string | number | boolean | null | undefined> = {
      page: this.page,
      limit: this.limit,
      q: this.q,
      sort: 'createdAt',
      order: 'desc'
    };
    if (filtersParam) params['filters'] = filtersParam;

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
        this.toast.show(this.extractErrorMessage(err));
      }
    });
  }

  selectLog(log: AuditLogItem): void {
    this.selected = log;
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

  pretty(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2) || '';
    } catch {
      return '';
    }
  }

  exportCsv(): void {
    this.auditLogsService.exportCsv().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit-logs.csv';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err: unknown) => {
        this.toast.show(this.extractErrorMessage(err));
      }
    });
  }
}
