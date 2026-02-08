import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminReviewsService } from '../../../core/services/admin-reviews.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-reviews',
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
})
export class ReviewsComponent implements OnInit {
  data: ReviewItem[] = [];
  total = 0;
  totalPages = 1;
  page = 1;
  limit = 10;
  q = '';
  loading = false;
  productId = '';

  constructor(
    private service: AdminReviewsService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service
      .list({
        page: this.page,
        limit: this.limit,
        q: this.q,
        productId: this.productId ? Number(this.productId) : undefined,
      })
      .subscribe({
      next: (res: unknown) => {
        this.data = this.extractData(res);
        this.total = this.extractTotal(res);
        this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.show('Unable to load reviews');
      },
    });
  }

  deleteReview(item: ReviewItem): void {
    if (!confirm('Delete this review?')) return;
    this.service.delete(item.id).subscribe({
      next: () => {
        this.toast.show('Review deleted');
        this.load();
      },
      error: () => this.toast.show('Unable to delete review'),
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

  private extractData(res: unknown): ReviewItem[] {
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
          productId: this.toNumber(row['productId']),
          rating: this.toNumber(row['rating']),
          comment: this.toString(row['comment']),
          createdAt: this.toString(row['createdAt']),
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

interface ReviewItem {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
}
