import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminProductsService } from '../../../core/services/admin-products.service';
import { AdminCategoriesService } from '../../../core/services/admin-categories.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  rows: Record<string, unknown>[] = [];
  loading = false;
  newName = '';
  newSlug = '';
  newDescription = '';
  newPriceCents = 0;
  newCurrency = 'EUR';
  newSku = '';
  newIsActive = true;
  newCategoryId = '';
  categories: Array<{ id: number; name: string }> = [];
  editingId = 0;
  editName = '';
  editSlug = '';
  editDescription = '';
  editPriceCents = 0;
  editCurrency = 'EUR';
  editSku = '';
  editIsActive = true;

  constructor(
    private service: AdminProductsService,
    private categoriesService: AdminCategoriesService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
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

  loadCategories(): void {
    this.categoriesService.list({ page: 1, limit: 100 }).subscribe({
      next: (res: unknown) => {
        const rows = this.asArray(res).map((x) => this.asRecord(x));
        this.categories = rows
          .map((row) => ({ id: Number(row['id']), name: String(row['name'] ?? '') }))
          .filter((row) => !Number.isNaN(row.id) && row.name.length > 0);
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  createProduct(): void {
    const name = this.newName.trim();
    const slug = this.newSlug.trim();
    const sku = this.newSku.trim();
    if (!name || !slug || !sku || !this.newCategoryId) {
      this.toast.error('Name, slug, sku and category are required');
      return;
    }
    this.service
      .create({
        name,
        slug,
        description: this.newDescription.trim(),
        priceCents: Number(this.newPriceCents),
        currency: this.newCurrency || 'EUR',
        sku,
        isActive: this.newIsActive,
        categoryIds: [Number(this.newCategoryId)],
      })
      .subscribe({
        next: () => {
          this.toast.success('Product created');
          this.newName = '';
          this.newSlug = '';
          this.newDescription = '';
          this.newPriceCents = 0;
          this.newCurrency = 'EUR';
          this.newSku = '';
          this.newIsActive = true;
          this.newCategoryId = '';
          this.load();
        },
        error: (err: unknown) => this.toast.error(this.extractErrorMessage(err)),
      });
  }

  startEdit(row: Record<string, unknown>): void {
    this.editingId = this.rowId(row);
    this.editName = String(row['name'] ?? '');
    this.editSlug = String(row['slug'] ?? '');
    this.editDescription = String(row['description'] ?? '');
    this.editPriceCents = Number(row['priceCents'] ?? 0);
    this.editCurrency = String(row['currency'] ?? 'EUR');
    this.editSku = String(row['sku'] ?? '');
    this.editIsActive = Boolean(row['isActive']);
  }

  cancelEdit(): void {
    this.editingId = 0;
    this.editName = '';
    this.editSlug = '';
    this.editDescription = '';
    this.editPriceCents = 0;
    this.editCurrency = 'EUR';
    this.editSku = '';
    this.editIsActive = true;
  }

  updateProduct(): void {
    if (!this.editingId) return;
    const name = this.editName.trim();
    const slug = this.editSlug.trim();
    const sku = this.editSku.trim();
    if (!name || !slug || !sku) {
      this.toast.error('Name, slug and sku are required');
      return;
    }
    this.service
      .update(this.editingId, {
        name,
        slug,
        description: this.editDescription.trim(),
        priceCents: Number(this.editPriceCents),
        currency: this.editCurrency || 'EUR',
        sku,
        isActive: this.editIsActive,
      })
      .subscribe({
        next: () => {
          this.toast.success('Product updated');
          this.cancelEdit();
          this.load();
        },
        error: (err: unknown) => this.toast.error(this.extractErrorMessage(err)),
      });
  }

  deleteProduct(row: Record<string, unknown>): void {
    const id = this.rowId(row);
    if (!id) return;
    if (!confirm('Delete this product?')) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        if (this.editingId === id) this.cancelEdit();
        this.load();
      },
      error: (err: unknown) => this.toast.error(this.extractErrorMessage(err)),
    });
  }
}
