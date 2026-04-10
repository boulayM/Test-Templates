export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
