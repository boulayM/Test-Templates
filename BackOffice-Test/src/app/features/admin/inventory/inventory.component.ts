import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminInventoryService } from '../../../core/services/admin-inventory.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  data: InventoryItem[] = [];
  total = 0;
  totalPages = 1;
  page = 1;
  limit = 10;
  q = '';
  loading = false;
  draft: Record<number, { quantity: number; reserved: number }> = {};
  form = { productId: '', quantity: '0', reserved: '0' };

  constructor(
    private service: AdminInventoryService,
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
        this.draft = {};
        for (const row of list) {
          this.draft[row.id] = { quantity: row.quantity, reserved: row.reserved };
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.show('Unable to load inventory');
      },
    });
  }

  createInventory(): void {
    const productId = Number(this.form.productId);
    if (!productId) {
      this.toast.show('Product id is required');
      return;
    }
    this.service
      .create({
        productId,
        quantity: Number(this.form.quantity || 0),
        reserved: Number(this.form.reserved || 0),
      })
      .subscribe({
        next: () => {
          this.toast.show('Inventory row created');
          this.form = { productId: '', quantity: '0', reserved: '0' };
          this.load();
        },
        error: () => this.toast.show('Unable to create inventory row'),
      });
  }

  updateInventory(item: InventoryItem): void {
    const payload = this.draft[item.id];
    if (!payload) return;
    this.service.update(item.id, payload).subscribe({
      next: () => {
        this.toast.show('Inventory updated');
        this.load();
      },
      error: () => this.toast.show('Unable to update inventory'),
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

  private extractData(res: unknown): InventoryItem[] {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    if (!Array.isArray(obj['data'])) return [];
    return (obj['data'] as unknown[])
      .filter((item) => !!item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>;
        const productObj =
          row['product'] && typeof row['product'] === 'object'
            ? (row['product'] as Record<string, unknown>)
            : null;
        return {
          id: this.toNumber(row['id']),
          productId: this.toNumber(row['productId']),
          productName: productObj ? this.toString(productObj['name']) : '',
          quantity: this.toNumber(row['quantity']),
          reserved: this.toNumber(row['reserved']),
          updatedAt: this.toString(row['updatedAt']),
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

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  formatDate(value: string): string {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
  }
}

interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  reserved: number;
  updatedAt: string;
}
