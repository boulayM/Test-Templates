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
  data: OrderItem[] = [];
  total = 0;
  totalPages = 1;
  page = 1;
  limit = 10;
  q = '';
  statusDraft: Record<number, string> = {};
  loading = false;

  readonly statuses = ['PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

  constructor(
    private service: AdminOrdersService,
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
        this.toast.show('Unable to load orders');
      },
    });
  }

  updateStatus(order: OrderItem): void {
    const nextStatus = this.statusDraft[order.id];
    if (!nextStatus || nextStatus === order.status) return;
    this.service.updateStatus(order.id, { status: nextStatus }).subscribe({
      next: () => {
        this.toast.show('Order status updated');
        this.load();
      },
      error: () => this.toast.show('Unable to update order status'),
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

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
  }

  private extractData(res: unknown): OrderItem[] {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    if (!Array.isArray(obj['data'])) return [];
    return (obj['data'] as unknown[])
      .filter((item) => !!item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: this.toNumber(row['id']),
          userId: this.toNumber(row['userId']),
          status: this.toString(row['status']),
          totalCents: this.toNullableNumber(row['totalCents']),
          currency: this.toNullableString(row['currency']),
          createdAt: this.toNullableString(row['createdAt']),
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

interface OrderItem {
  id: number;
  userId: number;
  status: string;
  totalCents: number | null;
  currency: string | null;
  createdAt: string | null;
}
