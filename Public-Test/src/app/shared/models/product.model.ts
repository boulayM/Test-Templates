export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface ProductInventory {
  quantity: number;
  reserved: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  sku: string;
  isActive: boolean;
  averageRating: number | null;
  reviewCount: number;
  images: ProductImage[];
  categories: Category[];
  inventory: ProductInventory | null;
}

export interface ProductListQuery {
  q?: string;
  activeOnly?: boolean;
  limit?: number;
}
