import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrdersService } from '../../../core/services/admin-orders.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  rows: Record<string, unknown>[] = [];
  loading = false;

  constructor(
    private service: AdminOrdersService,
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
    this.service.list({ page: 1, limit: 20 }).subscribe({
      next: (res: unknown) => {
        this.rows = this.asArray(res).map((x) => this.asRecord(x));
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

}
