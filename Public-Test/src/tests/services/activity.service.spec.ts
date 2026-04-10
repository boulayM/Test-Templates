import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ActivityService } from '../../app/core/services/activity.service';
import { ApiService } from '../../app/core/services/api.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'deleteRequest']);

    TestBed.configureTestingModule({
      providers: [ActivityService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(ActivityService);
  });

  it('should get cart', () => {
    api.get.and.returnValue(of({ cart: { id: 1, status: 'ACTIVE', items: [] } }));

    service.getCart().subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/cart');
  });

  it('should add product to cart', () => {
    api.post.and.returnValue(of({ item: {} }));

    service.addProduct(4, 2).subscribe();
    expect(api.post).toHaveBeenCalledWith('/public/cart/items', {
      productId: 4,
      quantity: 2,
    });
  });

  it('should update cart item quantity', () => {
    api.patch.and.returnValue(of({ item: {} }));

    service.updateQuantity(5, 2).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/public/cart/items/5', {
      quantity: 2,
    });
  });

  it('should remove cart item', () => {
    api.deleteRequest.and.returnValue(of({}));

    service.removeItem(7).subscribe();
    expect(api.deleteRequest).toHaveBeenCalledWith('/public/cart/items/7');
  });

  it('should validate coupon', () => {
    api.get.and.returnValue(of({ valid: true }));

    service.validateCoupon('SAVE10', 5000).subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/coupons/validate?code=SAVE10&orderTotalCents=5000');
  });
});
