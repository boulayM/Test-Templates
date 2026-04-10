import { Injectable } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { concatMap, last, map, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  CreateActivityItem,
  ActivityRecord,
  ActivityStatus,
} from '../../shared/models/activity.model';
import { ApiMessage } from '../../shared/models/api-message.model';

type ApiCartItem = {
  id: number;
  productId: number;
  quantity: number;
  unitPriceCents: number;
  product: {
    id: number;
    name: string;
    description?: string;
    priceCents: number;
    isActive: boolean;
  };
};

type ApiCart = {
  id: number;
  status: ActivityStatus;
  items: ApiCartItem[];
};

const mapCart = (cart: ApiCart): ActivityRecord => ({
  id: cart.id,
  activityDate: new Date().toISOString(),
  status: cart.status,
  items: (cart.items || []).map((item) => ({
    contentItemId: item.productId,
    contentItem: {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description || '',
      price: item.unitPriceCents / 100,
      isActive: item.product.isActive,
    },
    quantity: item.quantity,
    price: item.unitPriceCents / 100,
  })),
});

@Injectable({ providedIn: 'root' })
export class ActivityService {
  constructor(private api: ApiService) {}

  private fetchCartRecord(): Observable<ActivityRecord> {
    return this.api.get<{ cart: ApiCart }>('/public/cart').pipe(map((res) => mapCart(res.cart)));
  }

  getActivityRecords(): Observable<ActivityRecord[]> {
    return this.fetchCartRecord().pipe(map((record) => [record]));
  }

  getActivityRecordById(activityRecordId: number): Observable<ActivityRecord> {
    return this.fetchCartRecord().pipe(
      switchMap((record) => {
        if (record.id !== activityRecordId) {
          return throwError(() => new Error('Activity record not found'));
        }
        return of(record);
      }),
    );
  }

  createActivityRecord(items: CreateActivityItem[]): Observable<ActivityRecord> {
    if (!items.length) {
      return this.fetchCartRecord();
    }

    return from(items).pipe(
      concatMap((item) =>
        this.api.post('/public/cart/items', {
          productId: item.contentItemId,
          quantity: item.quantity,
        }),
      ),
      last(),
      switchMap(() => this.fetchCartRecord()),
    );
  }

  addContentItemToActivityRecord(
    _activityRecordId: number,
    contentItemId: number,
    quantity: number,
  ): Observable<ActivityRecord> {
    return this.api
      .post('/public/cart/items', {
        productId: contentItemId,
        quantity,
      })
      .pipe(switchMap(() => this.fetchCartRecord()));
  }

  updateQuantity(
    _activityRecordId: number,
    contentItemId: number,
    quantity: number,
  ): Observable<ActivityRecord> {
    return this.api.get<{ cart: ApiCart }>('/public/cart').pipe(
      switchMap((res) => {
        const cartItem = (res.cart.items || []).find((item) => item.productId === contentItemId);
        if (!cartItem) {
          return throwError(() => new Error('Cart item not found'));
        }
        return this.api.patch(`/public/cart/items/${cartItem.id}`, { quantity });
      }),
      switchMap(() => this.fetchCartRecord()),
    );
  }

  removeContentItem(_activityRecordId: number, contentItemId: number): Observable<ApiMessage> {
    return this.api.get<{ cart: ApiCart }>('/public/cart').pipe(
      switchMap((res) => {
        const cartItem = (res.cart.items || []).find((item) => item.productId === contentItemId);
        if (!cartItem) {
          return throwError(() => new Error('Cart item not found'));
        }
        return this.api.deleteRequest<ApiMessage>(`/public/cart/items/${cartItem.id}`);
      }),
    );
  }

  updateStatus(_activityRecordId: number, status: ActivityStatus): Observable<ActivityRecord> {
    if (status !== 'ABANDONED') {
      return throwError(() => new Error('Only ABANDONED status is supported on public cart'));
    }
    return this.api.post('/public/cart/abandon', {}).pipe(switchMap(() => this.fetchCartRecord()));
  }

  deleteActivityRecord(_activityRecordId: number): Observable<ApiMessage> {
    return this.api.post<ApiMessage>('/public/cart/abandon', {});
  }
}
