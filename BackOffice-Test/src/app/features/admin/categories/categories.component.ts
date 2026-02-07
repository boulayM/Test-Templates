import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCategoriesService } from '../../../core/services/admin-categories.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  data: CategoryItem[] = [];
  total = 0;
  totalPages = 1;
  page = 1;
  limit = 10;
  q = '';
  loading = false;
  form = { name: '', slug: '', parentId: '' };

  constructor(
    private service: AdminCategoriesService,
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
        this.toast.show('Unable to load categories');
      },
    });
  }

  createCategory(): void {
    if (!this.form.name.trim() || !this.form.slug.trim()) {
      this.toast.show('Name and slug are required');
      return;
    }
    this.service
      .create({
        name: this.form.name,
        slug: this.form.slug,
        parentId: this.form.parentId ? Number(this.form.parentId) : null,
      })
      .subscribe({
        next: () => {
          this.toast.show('Category created');
          this.form = { name: '', slug: '', parentId: '' };
          this.load();
        },
        error: () => this.toast.show('Unable to create category'),
      });
  }

  deleteCategory(item: CategoryItem): void {
    if (!confirm('Delete this category?')) return;
    this.service.delete(item.id).subscribe({
      next: () => {
        this.toast.show('Category deleted');
        this.load();
      },
      error: () => this.toast.show('Unable to delete category'),
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

  private extractData(res: unknown): CategoryItem[] {
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
          parentId: this.toNullableNumber(row['parentId']),
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

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  isActive: boolean;
}
