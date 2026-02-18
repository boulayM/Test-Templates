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
  rows: Record<string, unknown>[] = [];
  loading = false;
  newName = '';
  newSlug = '';
  newParentId = '';
  editingId = 0;
  editName = '';
  editSlug = '';
  editParentId = '';

  constructor(
    private service: AdminCategoriesService,
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

  private parseParentId(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
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

  createCategory(): void {
    const name = this.newName.trim();
    const slug = this.newSlug.trim();
    if (!name || !slug) {
      this.toast.error('Name and slug are required');
      return;
    }
    this.service
      .create({
        name,
        slug,
        parentId: this.parseParentId(this.newParentId),
      })
      .subscribe({
        next: () => {
          this.toast.success('Category created');
          this.newName = '';
          this.newSlug = '';
          this.newParentId = '';
          this.load();
        },
        error: (err: unknown) => this.toast.error(this.extractErrorMessage(err)),
      });
  }

  startEdit(row: Record<string, unknown>): void {
    this.editingId = this.rowId(row);
    this.editName = String(row['name'] ?? '');
    this.editSlug = String(row['slug'] ?? '');
    const parentId = row['parentId'];
    this.editParentId = parentId === null || parentId === undefined ? '' : String(parentId);
  }

  cancelEdit(): void {
    this.editingId = 0;
    this.editName = '';
    this.editSlug = '';
    this.editParentId = '';
  }

  updateCategory(): void {
    if (!this.editingId) return;
    const name = this.editName.trim();
    const slug = this.editSlug.trim();
    if (!name || !slug) {
      this.toast.error('Name and slug are required');
      return;
    }
    this.service
      .update(this.editingId, {
        name,
        slug,
        parentId: this.parseParentId(this.editParentId),
      })
      .subscribe({
        next: () => {
          this.toast.success('Category updated');
          this.cancelEdit();
          this.load();
        },
        error: (err: unknown) => this.toast.error(this.extractErrorMessage(err)),
      });
  }

  deleteCategory(row: Record<string, unknown>): void {
    const id = this.rowId(row);
    if (!id) return;
    if (!confirm('Delete this category?')) return;
    this.service.delete(id).subscribe({
      next: () => {
        this.toast.success('Category deleted');
        if (this.editingId === id) this.cancelEdit();
        this.load();
      },
      error: (err: unknown) => this.toast.error(this.extractErrorMessage(err)),
    });
  }
}
