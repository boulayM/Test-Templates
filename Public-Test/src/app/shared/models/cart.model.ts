import { Product } from './product.model';

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  product: Product;
}

export interface Cart {
  id: number;
  status: string;
  items: CartItem[];
}

export interface CouponValidationResult {
  valid: boolean;
  reason?: string;
  discountCents?: number;
  coupon?: {
    code: string;
    type: string;
    value: number;
  };
}
