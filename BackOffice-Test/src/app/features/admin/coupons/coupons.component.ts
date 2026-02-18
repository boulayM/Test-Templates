import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCouponsService } from '../../../core/services/admin-coupons.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-coupons',
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.scss',
})
export class CouponsComponent implements OnInit {
  rows: Record<string, unknown>[] = [];
  loading = false;

  newCode = '';
  newType = 'PERCENT';
  newValue = 10;

  constructor(
    private service: AdminCouponsService,
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

  createCoupon(): void {
    const code = this.newCode.trim();
    if (!code) {
      this.toast.error('Coupon code is required');
      return;
    }

    this.service
      .create({
        code,
        type: this.newType,
        value: Number(this.newValue),
        isActive: true,
      })
      .subscribe({
        next: () => {
          this.toast.success('Coupon created');
          this.newCode = '';
          this.newType = 'PERCENT';
          this.newValue = 10;
          this.load();
        },
        error: (err: unknown) => {
          this.toast.error(this.extractErrorMessage(err));
        },
      });
  }

  deleteCoupon(row: Record<string, unknown>): void {
    const id = this.rowId(row);
    if (!id) return;
    if (!confirm('Delete this coupon?')) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.toast.success('Coupon deleted');
        this.load();
      },
      error: (err: unknown) => {
        this.toast.error(this.extractErrorMessage(err));
      },
    });
  }
}
