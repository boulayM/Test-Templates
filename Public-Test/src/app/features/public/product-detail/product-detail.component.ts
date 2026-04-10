import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { ContentService } from '../../../core/services/content.service';
import { OrderService } from '../../../core/services/order.service';
import { LoginComponent } from '../../auth/login.component';
import { Product } from '../../../shared/models/product.model';
import { Review } from '../../../shared/models/review.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule, RouterModule, LoginComponent, NgbModalModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private contentService = inject(ContentService);
  private activityService = inject(ActivityService);
  private orderService = inject(OrderService);
  public auth = inject(AuthService);
  private toast = inject(ToastService);
  private modalService = inject(NgbModal);
  @ViewChild('buyAccessModal') buyAccessModal?: TemplateRef<unknown>;
  @ViewChild('loginModalContent') loginModalContent?: TemplateRef<unknown>;
  readonly product = signal<Product | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly canReview = signal(false);
  readonly placeholderImage = '/assets/image-placeholder.svg';
  reviewRating = 5;
  reviewComment = '';
  reviewError: string | null = null;
  reviewSaving = false;
  private modalRef: NgbModalRef | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Produit introuvable.');
      this.loading.set(false);
      return;
    }

    this.loadProduct(id);
    this.loadReviews(id);

    if (this.auth.isLoggedIn()) {
      this.orderService.getMyOrders().subscribe({
        next: (orders) => {
          const purchased = orders.some((order) =>
            order.items.some((item) => item.productId === id),
          );
          this.canReview.set(purchased);
        },
        error: () => undefined,
      });
    }
  }

  ngOnDestroy(): void {
    this.closeModal();
  }

  private loadProduct(id: number): void {
    this.contentService.getProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger ce produit.');
        this.loading.set(false);
      },
    });
  }

  private loadReviews(productId: number): void {
    this.contentService.getReviews(productId).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => undefined,
    });
  }

  handleBuyAction(): void {
    if (!this.auth.isLoggedIn()) {
      this.openAccessModal();
      return;
    }
    this.addToCart();
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;

    this.activityService.addProduct(product.id, 1).subscribe({
      next: () => this.toast.show(`${product.name} a ete ajoute au panier.`),
      error: () => this.toast.show('Impossible d ajouter ce produit au panier.'),
    });
  }

  openAccessModal(): void {
    if (!this.buyAccessModal || this.modalRef) return;
    this.modalRef = this.modalService.open(this.buyAccessModal, {
      centered: true,
    });
    this.modalRef.result.finally(() => {
      this.modalRef = null;
    });
  }

  openLoginModal(): void {
    this.closeModal();
    if (!this.loginModalContent) return;
    this.modalRef = this.modalService.open(this.loginModalContent, {
      centered: true,
      size: 'lg',
      scrollable: true,
    });
    this.modalRef.result.finally(() => {
      this.modalRef = null;
    });
  }

  closeModal(): void {
    this.modalRef?.close();
    this.modalRef = null;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImage;
  }

  submitReview(): void {
    const product = this.product();
    const currentUser = this.auth.getCurrentUser();
    if (!product || !currentUser || !this.canReview()) {
      return;
    }

    this.reviewSaving = true;
    this.reviewError = null;
    const existing = this.reviews().find((review) => review.userId === currentUser.id);
    const payload = { rating: this.reviewRating, comment: this.reviewComment.trim() };
    const request = existing
      ? this.contentService.updateReview(existing.id, payload)
      : this.contentService.createReview({ productId: product.id, ...payload });

    request.subscribe({
      next: (review) => {
        if (existing) {
          this.reviews.set(this.reviews().map((item) => (item.id === review.id ? review : item)));
        } else {
          this.reviews.set([review, ...this.reviews()]);
        }
        this.reviewSaving = false;
        this.toast.show('Votre avis a ete enregistre.');
      },
      error: (error) => {
        this.reviewSaving = false;
        this.reviewError =
          error?.error?.message || 'Impossible d enregistrer votre avis pour le moment.';
      },
    });
  }
}
