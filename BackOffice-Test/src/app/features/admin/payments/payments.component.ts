import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPaymentsService } from '../../../core/services/admin-payments.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent implements OnInit {
  rows: Record<string, unknown>[] = [];
  loading = false;
  statusDrafts: Record<number, string> = {};

  statuses = ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'];

  constructor(
    private service: AdminPaymentsService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private extractErrorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') return 'Operation failed';
    const e = err as { error?: { message?: string; details?: string }; message?: string };
    return e.error?.message || e.error?.details || e.message || 'Operation failed';
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
    return {};
  }

  private asArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    const rec = this.asRecord(value);
    const data = rec['data'];
    if (Array.isArray(data)) return data;
    return [];
  }


  rowId(row: Record<string, unknown>): number {
    const id = Number(row['id']);
    return Number.isNaN(id) ? 0 : id;
  }
  load(): void {
    this.loading = true;
    this.service.list({ page: 1, limit: 20, sort: 'id', order: 'desc' }).subscribe({
      next: (res: unknown) => {
        this.rows = this.asArray(res).map((x) => this.asRecord(x));
        this.statusDrafts = {};
        for (const row of this.rows) {
          const id = Number(row['id']);
          const status = typeof row['status'] === 'string' ? row['status'] : 'CREATED';
          if (!Number.isNaN(id)) this.statusDrafts[id] = status;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.toast.error(this.extractErrorMessage(err));
        this.cdr.detectChanges();
      },
    });
  }

  updateStatus(row: Record<string, unknown>): void {
    const id = Number(row['id']);
    if (Number.isNaN(id)) return;
    const status = this.statusDrafts[id];
    if (!status) return;

    this.service.updateStatus(id, status).subscribe({
      next: () => {
        this.toast.success('Payment status updated');
        this.load();
      },
      error: (err: unknown) => {
        this.toast.error(this.extractErrorMessage(err));
      },
    });
  }
}