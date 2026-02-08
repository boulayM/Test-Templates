import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminProductsService } from '../../../core/services/admin-products.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';
import { ValidationMessages } from '../../../shared/messages/validation-messages';
import { FormAlertState, mapBackendError } from '../../../shared/utils/backend-error-mapper';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, FormAlertComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
  data: ProductItem[] = [];
  total = 0;
  totalPages = 1;
  page = 1;
  limit = 10;
  q = '';
  loading = false;
  formAlert: FormAlertState | null = null;
  form = {
    name: '',
    slug: '',
    sku: '',
    priceCents: '',
    currency: 'EUR',
    isActive: true,
    description: '',
  };

  constructor(
    private service: AdminProductsService,
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
        this.toast.error('Unable to load products');
      },
    });
  }

  createProduct(): void {
    if (!this.form.name.trim() || !this.form.slug.trim() || !this.form.sku.trim()) {
      this.formAlert = {
        title: 'Validation error',
        message: ValidationMessages.genericSubmit,
        items: ['Name, slug and sku are required'],
      };
      return;
    }
    this.formAlert = null;
    this.service
      .create({
        name: this.form.name,
        slug: this.form.slug,
        sku: this.form.sku,
        priceCents: Number(this.form.priceCents || 0),
        currency: this.form.currency || 'EUR',
        isActive: this.form.isActive,
        description: this.form.description,
      })
      .subscribe({
        next: () => {
          this.toast.success('Product created');
          this.form = {
            name: '',
            slug: '',
            sku: '',
            priceCents: '',
            currency: 'EUR',
            isActive: true,
            description: '',
          };
          this.load();
        },
        error: (err: unknown) => {
          this.formAlert = mapBackendError(err, 'Unable to create product').alert;
        },
      });
  }

  toggleActive(item: ProductItem): void {
    this.service.update(item.id, { isActive: !item.isActive }).subscribe({
      next: () => {
        this.toast.success('Product updated');
        this.load();
      },
      error: () => this.toast.error('Unable to update product'),
    });
  }

  deleteProduct(item: ProductItem): void {
    if (!confirm('Delete this product?')) return;
    this.service.delete(item.id).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        this.load();
      },
      error: () => this.toast.error('Unable to delete product'),
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

  formatMoney(value: number, currency: string): string {
    return `${(value / 100).toFixed(2)} ${currency || 'EUR'}`;
  }

  private extractData(res: unknown): ProductItem[] {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    if (!Array.isArray(obj['data'])) return [];
    return (obj['data'] as unknown[])
      .filter((item) => !!item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: this.toNumber(row['id']),
          name: this.toString(row['name']),
          slug: this.toString(row['slug']),
          sku: this.toString(row['sku']),
          priceCents: this.toNumber(row['priceCents']),
          currency: this.toString(row['currency']),
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

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private toBoolean(value: unknown): boolean {
    return typeof value === 'boolean' ? value : false;
  }
}

interface ProductItem {
  id: number;
  name: string;
  slug: string;
  sku: string;
  priceCents: number;
  currency: string;
  isActive: boolean;
}
