import { ActivityStatus } from './activity.model';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
}

export interface Shipment {
  id: number;
  orderId: number;
  carrier?: string | null;
  trackingNumber?: string | null;
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'LOST';
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

export interface Payment {
  id: number;
  orderId: number;
  provider: string;
  status: 'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  amountCents: number;
  currency: string;
  createdAt?: string;
}

export interface OrderRecord {
  id: number;
  status: ActivityStatus;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
  createdAt?: string;
  items: OrderItem[];
  payments?: Payment[];
  shipments?: Shipment[];
}
