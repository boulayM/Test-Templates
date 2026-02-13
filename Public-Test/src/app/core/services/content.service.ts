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
};

const mapProduct = (product: ApiProduct): ContentItem => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  price: product.priceCents / 100,
  isActive: product.isActive,
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
