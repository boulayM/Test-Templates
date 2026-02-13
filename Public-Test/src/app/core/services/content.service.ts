import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiMessage } from '../../shared/models/api-message.model';
import { ContentItem, ContentItemDraft } from '../../shared/models/content-item.model';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ContentService {
  constructor(private api: ApiService) {}

  getContentItems(): Observable<ContentItem[]> {
    return this.api
      .get<{ data: ContentItem[] }>('/public/content')
      .pipe(map((res) => res.data || []));
  }

  getContentItemById(contentItemId: number): Observable<ContentItem> {
    return this.api.get<ContentItem>(`/public/content/${contentItemId}`);
  }

  createContentItem(contentItem: ContentItemDraft): Observable<ContentItem> {
    return this.api.post<ContentItem>('/public/content', contentItem);
  }

  updateContentItem(
    contentItemId: number,
    contentItem: Partial<ContentItemDraft>,
  ): Observable<ContentItem> {
    return this.api.patch<ContentItem>(`/public/content/${contentItemId}`, contentItem);
  }

  deleteContentItem(contentItemId: number): Observable<ApiMessage> {
    return this.api.deleteRequest<ApiMessage>(`/public/content/${contentItemId}`);
  }
}
