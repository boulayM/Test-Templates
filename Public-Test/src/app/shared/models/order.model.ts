export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
}

export interface PaymentSummary {
  id: number;
  provider: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface ShipmentSummary {
  id: number;
  carrier: string;
  trackingNumber: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface OrderCouponSummary {
  id: number;
  couponId: number;
  coupon?: {
    code: string;
    type: string;
    value: number;
  };
}

export interface Order {
  id: number;
  userId: number;
  shippingAddressId: number;
  billingAddressId: number;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: OrderItem[];
  payments: PaymentSummary[];
  shipments: ShipmentSummary[];
  coupons: OrderCouponSummary[];
}
