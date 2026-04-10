import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ContentService } from '../../app/core/services/content.service';
import { ApiService } from '../../app/core/services/api.service';

describe('ContentService', () => {
  let service: ContentService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'deleteRequest']);

    TestBed.configureTestingModule({
      providers: [ContentService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(ContentService);
  });

  it('should get active products', () => {
    api.get.and.returnValue(of({ data: [] }));

    service.getProducts({ activeOnly: true }).subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/products?activeOnly=true');
  });

  it('should get product by id', () => {
    api.get.and.returnValue(of({ product: {} }));

    service.getProductById(3).subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/products/3');
  });

  it('should get categories', () => {
    api.get.and.returnValue(of({ data: [] }));

    service.getCategories().subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/categories');
  });

  it('should create review', () => {
    api.post.and.returnValue(of({ review: {} }));

    service.createReview({ productId: 4, rating: 5, comment: 'Top' }).subscribe();
    expect(api.post).toHaveBeenCalledWith('/public/reviews', {
      productId: 4,
      rating: 5,
      comment: 'Top',
    });
  });

  it('should update review', () => {
    api.patch.and.returnValue(of({ review: {} }));

    service.updateReview(9, { rating: 4, comment: 'Bien' }).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/public/reviews/9', {
      rating: 4,
      comment: 'Bien',
    });
  });
});
