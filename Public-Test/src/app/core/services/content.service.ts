import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { Category, Product, ProductListQuery } from '../../shared/models/product.model';
import { Review } from '../../shared/models/review.model';
import { environment } from '../../../environments/environment';

type ProductApi = {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  sku: string;
  isActive: boolean;
  averageRating?: number | null;
  reviewCount?: number;
  images?: Array<{
    id: number;
    url?: string;
    alt?: string | null;
    imageUrl?: string;
    altText?: string | null;
    sortOrder: number;
  }>;
  categories?: Array<{
    category: Category;
  }>;
  inventory?: {
    quantity: number;
    reserved: number;
  } | null;
};

const getConfiguredApiUrl = (): string =>
  (window as Window & { __env?: { API_URL?: string } }).__env?.API_URL || environment.apiUrl;

const getApiOrigin = (): string => {
  const baseUrl = getConfiguredApiUrl().replace(/\/+$/, '');
  return baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;
};

const resolveImageUrl = (imageUrl?: string): string => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${getApiOrigin()}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
};

const mapProduct = (product: ProductApi): Product => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  priceCents: product.priceCents,
  currency: product.currency,
  sku: product.sku,
  isActive: product.isActive,
  averageRating: product.averageRating ?? null,
  reviewCount: product.reviewCount ?? 0,
  images: (product.images || []).map((image) => ({
    id: image.id,
    imageUrl: resolveImageUrl(image.url || image.imageUrl),
    altText: image.alt ?? image.altText ?? null,
    sortOrder: image.sortOrder,
  })),
  categories: (product.categories || []).map((item) => item.category),
  inventory: product.inventory || null,
});

@Injectable({ providedIn: 'root' })
export class ContentService {
  private api = inject(ApiService);

  getProducts(query: ProductListQuery = {}): Observable<Product[]> {
    const params = new URLSearchParams();
    if (query.activeOnly) params.set('activeOnly', 'true');
    if (query.q) params.set('q', query.q.trim());
    if (query.limit) params.set('limit', String(query.limit));
    const suffix = params.toString() ? `?${params.toString()}` : '';

    return this.api
      .get<{ data: ProductApi[] }>(`/public/products${suffix}`)
      .pipe(map((res) => (res.data || []).map(mapProduct)));
  }

  getProductById(productId: number): Observable<Product> {
    return this.api
      .get<{ product: ProductApi }>(`/public/products/${productId}`)
      .pipe(map((res) => mapProduct(res.product)));
  }

  getCategories(): Observable<Category[]> {
    return this.api
      .get<{ data: Category[] }>('/public/categories')
      .pipe(map((res) => res.data || []));
  }

  getReviews(productId: number): Observable<Review[]> {
    return this.api
      .get<{ data: Review[] }>(`/public/reviews?productId=${productId}`)
      .pipe(map((res) => res.data || []));
  }

  createReview(payload: { productId: number; rating: number; comment: string }): Observable<Review> {
    return this.api
      .post<{ review: Review }>('/public/reviews', payload)
      .pipe(map((res) => res.review));
  }

  updateReview(reviewId: number, payload: { rating: number; comment: string }): Observable<Review> {
    return this.api
      .patch<{ review: Review }>(`/public/reviews/${reviewId}`, payload)
      .pipe(map((res) => res.review));
  }
}

