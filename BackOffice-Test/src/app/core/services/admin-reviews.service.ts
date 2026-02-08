import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class AdminReviewsService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/reviews', params, true);
  }

  delete(id: number) {
    return this.api.deleteRequest('/admin/reviews/' + id);
  }
}

