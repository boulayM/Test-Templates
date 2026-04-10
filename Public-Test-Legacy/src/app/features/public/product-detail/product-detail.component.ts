import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ContentService } from '../../../core/services/content.service';
import { ReviewService } from '../../../core/services/review.service';
import { ContentItem } from '../../../shared/models/content-item.model';
import { Review } from '../../../shared/models/review.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent implements OnInit {
  product: ContentItem | null = null;
  reviews: Review[] = [];
  loading = true;
  rating = 5;
  comment = '';

  constructor(
    private route: ActivatedRoute,
    public auth: AuthService,
    private contentService: ContentService,
    private reviewService: ReviewService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(id)) {
      this.loading = false;
      return;
    }
    this.contentService.getContentItemById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loadReviews(id);
      },
      error: () => {
        this.loading = false;
        this.toast.show('Produit introuvable.');
      },
    });
  }

  loadReviews(productId: number): void {
    this.reviewService.listByProduct(productId).subscribe({
      next: (items) => {
        this.reviews = items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Impossible de charger les avis.');
      },
    });
  }

  submitReview(): void {
    if (!this.product) return;
    this.reviewService
      .createReview({
        productId: this.product.id,
        rating: this.rating,
        comment: this.comment || null,
      })
      .subscribe({
        next: () => {
          this.comment = '';
          this.loadReviews(this.product!.id);
          this.toast.show('Avis enregistre.');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Impossible de publier l avis.';
          this.toast.show(msg);
        },
      });
  }

  deleteReview(reviewId: number): void {
    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        if (this.product) {
          this.loadReviews(this.product.id);
        }
      },
      error: () => this.toast.show('Impossible de supprimer l avis.'),
    });
  }

  canDeleteReview(review: Review): boolean {
    const currentUser = this.auth.getCurrentUser();
    return !!currentUser && review.userId === currentUser.id;
  }
}
