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
  rows: Record<string, unknown>[] = [];
  loading = false;
  quantityDrafts: Record<number, number> = {};

  constructor(
    private service: AdminInventoryService,
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
        this.quantityDrafts = {};
        for (const row of this.rows) {
          const id = Number(row['id']);
          const qty = Number(row['quantity']);
          if (!Number.isNaN(id) && !Number.isNaN(qty)) this.quantityDrafts[id] = qty;
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

  updateQuantity(row: Record<string, unknown>): void {
    const id = Number(row['id']);
    if (Number.isNaN(id)) return;
    const quantity = Number(this.quantityDrafts[id]);
    if (Number.isNaN(quantity) || quantity < 0) {
      this.toast.error('Quantity must be a positive integer');
      return;
    }

    this.service.update(id, { quantity }).subscribe({
      next: () => {
        this.toast.success('Inventory updated');
        this.load();
      },
      error: (err: unknown) => {
        this.toast.error(this.extractErrorMessage(err));
      },
    });
  }
}