import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiMessage } from '../../shared/models/api-message.model';
import { ContentItem, ContentItemDraft } from '../../shared/models/content-item.model';

type ApiProduct = {
  id: number;
  name: string;
  description?: string | null;
  priceCents: number;
  isActive: boolean;
  inventory?: { quantity: number; reserved: number } | null;
  categories?: Array<
    | { category?: { name?: string | null } | null }
    | { name?: string | null }
    | string
  >;
};

const extractCategoryName = (
  entry: { category?: { name?: string | null } | null } | { name?: string | null } | string,
): string => {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    if ('category' in entry) {
      const cat = (entry as { category?: unknown }).category;
      if (typeof cat === 'string') return cat;
      if (cat && typeof cat === 'object' && 'name' in cat) {
        return String((cat as { name?: unknown }).name ?? '');
      }
      return '';
    }
    if ('categoryName' in entry) return String((entry as { categoryName?: unknown }).categoryName ?? '');
    if ('name' in entry) return entry.name || '';
  }
  return '';
};

const mapProduct = (product: ApiProduct): ContentItem => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  price: product.priceCents / 100,
  isActive: product.isActive,
  isAvailable:
    product.inventory == null
      ? product.isActive
      : product.isActive && product.inventory.quantity - product.inventory.reserved > 0,
  categories: (product.categories || [])
    .map((entry) => extractCategoryName(entry))
    .map((name) => name.trim())
    .filter((name) => !!name),
});

@Injectable({ providedIn: 'root' })
export class ContentService {
  constructor(private api: ApiService) {}

  getContentItems(): Observable<ContentItem[]> {
    return this.api
      .get<{ data: ApiProduct[] }>('/public/products?page=1&limit=20&activeOnly=true')
      .pipe(map((res) => (res.data || []).map(mapProduct)));
  }

  getContentItemById(contentItemId: number): Observable<ContentItem> {
    return this.api
      .get<{ product: ApiProduct }>(`/public/products/${contentItemId}`)
      .pipe(map((res) => mapProduct(res.product)));
  }

  createContentItem(_contentItem: ContentItemDraft): Observable<ContentItem> {
    return throwError(() => new Error('Not supported on public API'));
  }

  updateContentItem(
    _contentItemId: number,
    _contentItem: Partial<ContentItemDraft>,
  ): Observable<ContentItem> {
    return throwError(() => new Error('Not supported on public API'));
  }

  deleteContentItem(_contentItemId: number): Observable<ApiMessage> {
    return throwError(() => new Error('Not supported on public API'));
  }
}
