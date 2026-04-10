import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { Cart, CartItem, CouponValidationResult } from '../../shared/models/cart.model';
import { Product } from '../../shared/models/product.model';
import { ApiMessage } from '../../shared/models/api-message.model';

type CartProduct = Product;

type CartApi = {
  id: number;
  status: string;
  items?: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPriceCents: number;
    currency: string;
    product: CartProduct;
  }>;
};

const mapCart = (cart: CartApi): Cart => ({
  id: cart.id,
  status: cart.status,
  items: (cart.items || []).map(
    (item): CartItem => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      currency: item.currency,
      product: item.product,
    }),
  ),
});

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private api = inject(ApiService);

  getCart(): Observable<Cart> {
    return this.api.get<{ cart: CartApi }>('/public/cart').pipe(map((res) => mapCart(res.cart)));
  }

  addProduct(productId: number, quantity = 1): Observable<CartItem> {
    return this.api
      .post<{ item: CartItem }>('/public/cart/items', { productId, quantity })
      .pipe(map((res) => res.item));
  }

  updateQuantity(itemId: number, quantity: number): Observable<CartItem> {
    return this.api
      .patch<{ item: CartItem }>(`/public/cart/items/${itemId}`, { quantity })
      .pipe(map((res) => res.item));
  }

  removeItem(itemId: number): Observable<ApiMessage> {
    return this.api.deleteRequest<ApiMessage>(`/public/cart/items/${itemId}`);
  }

  validateCoupon(code: string, orderTotalCents: number): Observable<CouponValidationResult> {
    return this.api.get<CouponValidationResult>(
      `/public/coupons/validate?code=${encodeURIComponent(code)}&orderTotalCents=${orderTotalCents}`,
    );
  }

  abandonCart(): Observable<{ cart: Cart; abandonedCartId: number | null }> {
    return this.api.post<{ cart: CartApi; abandonedCartId: number | null }>('/public/cart/abandon', {}).pipe(
      map((res) => ({
        cart: mapCart(res.cart),
        abandonedCartId: res.abandonedCartId,
      })),
    );
  }
}
