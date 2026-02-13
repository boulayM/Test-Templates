import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateActivityItem,
  ActivityRecord,
  ActivityStatus,
} from '../../shared/models/activity.model';
import { ApiMessage } from '../../shared/models/api-message.model';
import { map } from 'rxjs/operators';

type ApiActivityItem = {
  productId: number;
  product: {
    id: number;
    name: string;
    description?: string;
    price: number;
    isActive: boolean;
  };
  quantity: number;
  price: number;
};

type ApiActivityRecord = {
  id: number;
  orderDate: string;
  status: ActivityStatus;
  items: ApiActivityItem[];
};

const mapApiRecord = (record: ApiActivityRecord): ActivityRecord => ({
  id: record.id,
  activityDate: record.orderDate,
  status: record.status,
  items: (record.items || []).map((item) => ({
    contentItemId: item.productId,
    contentItem: item.product,
    quantity: item.quantity,
    price: item.price,
  })),
});

@Injectable({ providedIn: 'root' })
export class ActivityService {
  constructor(private api: ApiService) {}

  getActivityRecords(): Observable<ActivityRecord[]> {
    return this.api
      .get<{ data: ApiActivityRecord[] }>('/account/activity')
      .pipe(map((res) => (res.data || []).map(mapApiRecord)));
  }

  getActivityRecordById(activityRecordId: number): Observable<ActivityRecord> {
    return this.api
      .get<ApiActivityRecord>(`/account/activity/${activityRecordId}`)
      .pipe(map(mapApiRecord));
  }

  createActivityRecord(items: CreateActivityItem[]): Observable<ActivityRecord> {
    return this.api
      .post<ApiActivityRecord>('/account/activity', {
        items: items.map((item) => ({
          productId: item.contentItemId,
          quantity: item.quantity,
        })),
      })
      .pipe(map(mapApiRecord));
  }

  addContentItemToActivityRecord(
    activityRecordId: number,
    contentItemId: number,
    quantity: number,
  ): Observable<ActivityRecord> {
    return this.api
      .post<ApiActivityRecord>(`/account/activity/${activityRecordId}/items`, {
        productId: contentItemId,
        quantity,
      })
      .pipe(map(mapApiRecord));
  }

  updateQuantity(
    activityRecordId: number,
    contentItemId: number,
    quantity: number,
  ): Observable<ActivityRecord> {
    return this.api
      .deleteRequest<ApiMessage>(`/account/activity/${activityRecordId}/items/${contentItemId}`)
      .pipe(
        switchMap(() =>
          this.api.post<ApiActivityRecord>(`/account/activity/${activityRecordId}/items`, {
            productId: contentItemId,
            quantity,
          }),
        ),
        map(mapApiRecord),
      );
  }

  removeContentItem(activityRecordId: number, contentItemId: number): Observable<ApiMessage> {
    return this.api.deleteRequest<ApiMessage>(
      `/account/activity/${activityRecordId}/items/${contentItemId}`,
    );
  }

  updateStatus(activityRecordId: number, status: ActivityStatus): Observable<ActivityRecord> {
    return this.api
      .patch<ApiActivityRecord>(`/account/activity/${activityRecordId}/status`, { status })
      .pipe(map(mapApiRecord));
  }

  deleteActivityRecord(activityRecordId: number): Observable<ApiMessage> {
    return this.api.deleteRequest<ApiMessage>(`/account/activity/${activityRecordId}`);
  }
}
