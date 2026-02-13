export interface ContentItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
}

export type ContentItemDraft = Omit<ContentItem, 'id'> & { id?: number };
