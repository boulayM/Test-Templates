import { ContentItem } from './content-item.model';

export type ActivityStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface ActivityItem {
  contentItemId: number;
  contentItem: ContentItem;
  quantity: number;
  price: number;
}

export interface ActivityRecord {
  id: number;
  activityDate: string;
  status: ActivityStatus;
  items: ActivityItem[];
}

export interface CreateActivityItem {
  contentItemId: number;
  quantity: number;
}
