import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { ContentService } from '../../../core/services/content.service';
import { Category, Product } from '../../../shared/models/product.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-content',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit, OnDestroy {
  private contentService = inject(ContentService);
  private activityService = inject(ActivityService);
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  readonly placeholderImage = '/assets/image-placeholder.svg';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  selectedCategory = '';
  searchTerm = '';
  loading = true;
  error: string | null = null;
  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.queryParams.subscribe((params) => {
        this.selectedCategory = params['category'] || '';
        this.searchTerm = params['q'] || '';
        this.loadCatalog();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadCatalog(): void {
    this.loading = true;
    this.error = null;

    this.contentService.getCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => undefined,
    });

    this.contentService
      .getProducts({ activeOnly: true, limit: 100 })
      .subscribe({
        next: (products) => {
          this.products = products;
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.error = 'Impossible de charger le catalogue.';
          this.loading = false;
        },
      });
  }

  private applyFilters(): void {
    const query = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = this.products.filter((product) => {
      const matchesCategory =
        !this.selectedCategory ||
        product.categories.some(
          (category) => category.slug === this.selectedCategory,
        );
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        product.categories.some((category) =>
          category.name.toLowerCase().includes(query),
        );

      return matchesCategory && matchesQuery;
    });
  }

  addToCart(product: Product): void {
    this.activityService.addProduct(product.id, 1).subscribe({
      next: () => this.toast.show(`${product.name} a ete ajoute au panier.`),
      error: () =>
        this.toast.show('Impossible d ajouter ce produit au panier.'),
    });
  }

  isAvailable(product: Product): boolean {
    if (!product.isActive) return false;
    if (!product.inventory) return true;
    return product.inventory.quantity - product.inventory.reserved > 0;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImage;
  }
}
