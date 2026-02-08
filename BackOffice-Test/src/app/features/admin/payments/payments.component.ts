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
  data: PaymentItem[] = [];
  total = 0;
  totalPages = 1;
  page = 1;
  limit = 10;
  q = '';
  statusDraft: Record<number, string> = {};
  loading = false;

  readonly statuses = ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'];

  constructor(
    private service: AdminPaymentsService,
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
        const list = this.extractData(res);
        this.data = list;
        this.total = this.extractTotal(res);
        this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
        this.statusDraft = {};
        for (const item of list) {
          this.statusDraft[item.id] = item.status;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.show('Unable to load payments');
      },
    });
  }

  updateStatus(payment: PaymentItem): void {
    const nextStatus = this.statusDraft[payment.id];
    if (!nextStatus || nextStatus === payment.status) return;
    this.service.updateStatus(payment.id, { status: nextStatus }).subscribe({
      next: () => {
        this.toast.show('Payment status updated');
        this.load();
      },
      error: () => this.toast.show('Unable to update payment status'),
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

  formatMoney(value: number | null | undefined, currency: string | null | undefined): string {
    if (typeof value !== 'number') return '-';
    return `${(value / 100).toFixed(2)} ${currency || 'EUR'}`;
  }

  private extractData(res: unknown): PaymentItem[] {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    if (!Array.isArray(obj['data'])) return [];
    return (obj['data'] as unknown[])
      .filter((item) => !!item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: this.toNumber(row['id']),
          orderId: this.toNumber(row['orderId']),
          provider: this.toString(row['provider']),
          status: this.toString(row['status']),
          amountCents: this.toNullableNumber(row['amountCents']),
          currency: this.toNullableString(row['currency']),
        };
      })
      .filter((item) => item.id > 0);
  }

  private extractTotal(res: unknown): number {
    if (!res || typeof res !== 'object') return 0;
    const obj = res as Record<string, unknown>;
    return this.toNumber(obj['total']);
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

  private toNullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }
}

interface PaymentItem {
  id: number;
  orderId: number;
  provider: string;
  status: string;
  amountCents: number | null;
  currency: string | null;
}
