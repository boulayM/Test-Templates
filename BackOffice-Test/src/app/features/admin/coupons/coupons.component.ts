import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCouponsService } from '../../../core/services/admin-coupons.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';
import { ValidationMessages } from '../../../shared/messages/validation-messages';
import { FormAlertState, mapBackendError } from '../../../shared/utils/backend-error-mapper';

@Component({
  selector: 'app-coupons',
  imports: [CommonModule, FormsModule, FormAlertComponent],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.scss',
})
export class CouponsComponent implements OnInit {
  data: CouponItem[] = [];
  total = 0;
  totalPages = 1;
  page = 1;
  limit = 10;
  q = '';
  loading = false;
  formAlert: FormAlertState | null = null;
  editId: number | null = null;
  edit = { value: '', isActive: false };
  form = {
    code: '',
    type: 'PERCENT',
    value: '',
    minOrderCents: '',
    usageLimit: '',
    isActive: true,
  };

  constructor(
    private service: AdminCouponsService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.list({ page: this.page, limit: this.limit, q: this.q }).subscribe({
      next: (res: unknown) => {
        this.data = this.extractData(res);
        this.total = this.extractTotal(res);
        this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Unable to load coupons');
      },
    });
  }

  createCoupon(): void {
    if (!this.form.code.trim()) {
      this.formAlert = {
        title: 'Validation error',
        message: ValidationMessages.genericSubmit,
        items: ['Code is required'],
      };
      return;
    }
    this.formAlert = null;
    this.service
      .create({
        code: this.form.code,
        type: this.form.type,
        value: Number(this.form.value || 0),
        minOrderCents: this.form.minOrderCents ? Number(this.form.minOrderCents) : undefined,
        usageLimit: this.form.usageLimit ? Number(this.form.usageLimit) : undefined,
        isActive: this.form.isActive,
      })
      .subscribe({
        next: () => {
          this.toast.success('Coupon created');
          this.form = {
            code: '',
            type: 'PERCENT',
            value: '',
            minOrderCents: '',
            usageLimit: '',
            isActive: true,
          };
          this.load();
        },
        error: (err: unknown) => {
          this.formAlert = mapBackendError(err, 'Unable to create coupon').alert;
        },
      });
  }

  startEdit(item: CouponItem): void {
    this.editId = item.id;
    this.edit = { value: String(item.value), isActive: item.isActive };
  }

  cancelEdit(): void {
    this.editId = null;
  }

  saveEdit(item: CouponItem): void {
    if (this.editId !== item.id) return;
    this.service
      .update(item.id, { value: Number(this.edit.value || 0), isActive: this.edit.isActive })
      .subscribe({
        next: () => {
          this.toast.success('Coupon updated');
          this.editId = null;
          this.load();
        },
        error: (err: unknown) => {
          this.formAlert = mapBackendError(err, 'Unable to update coupon').alert;
        },
      });
  }

  deleteCoupon(item: CouponItem): void {
    if (!confirm('Delete this coupon?')) return;
    this.service.delete(item.id).subscribe({
      next: () => {
        this.toast.success('Coupon deleted');
        this.load();
      },
      error: () => this.toast.error('Unable to delete coupon'),
    });
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

  private extractData(res: unknown): CouponItem[] {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    if (!Array.isArray(obj['data'])) return [];
    return (obj['data'] as unknown[])
      .filter((item) => !!item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: this.toNumber(row['id']),
          code: this.toString(row['code']),
          type: this.toString(row['type']),
          value: this.toNumber(row['value']),
          minOrderCents: this.toNullableNumber(row['minOrderCents']),
          usageLimit: this.toNullableNumber(row['usageLimit']),
          usedCount: this.toNumber(row['usedCount']),
          isActive: this.toBoolean(row['isActive']),
        };
      })
      .filter((item) => item.id > 0);
  }

  private extractTotal(res: unknown): number {
    if (!res || typeof res !== 'object') return 0;
    const obj = res as Record<string, unknown>;
    return this.toNumber(obj['total']) || this.extractData(res).length;
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' ? value : 0;
  }

  private toNullableNumber(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private toBoolean(value: unknown): boolean {
    return typeof value === 'boolean' ? value : false;
  }
}

interface CouponItem {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrderCents: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}
