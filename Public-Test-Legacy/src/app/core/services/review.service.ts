import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Review } from '../../shared/models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private api: ApiService) {}

  listByProduct(productId: number): Observable<Review[]> {
    return this.api
      .get<{ data: Review[] }>(`/public/reviews?productId=${productId}`)
      .pipe(map((res) => res.data || []));
  }

  createReview(input: { productId: number; rating: number; comment?: string | null }): Observable<Review> {
    return this.api
      .post<{ review: Review }>('/public/reviews', input)
      .pipe(map((res) => res.review));
  }

  updateReview(reviewId: number, input: { rating?: number; comment?: string | null }): Observable<Review> {
    return this.api
      .patch<{ review: Review }>(`/public/reviews/${reviewId}`, input)
      .pipe(map((res) => res.review));
  }

  deleteReview(reviewId: number): Observable<{ message: string }> {
    return this.api.deleteRequest<{ message: string }>(`/public/reviews/${reviewId}`);
  }
}
