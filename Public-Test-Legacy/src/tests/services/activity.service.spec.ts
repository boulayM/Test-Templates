import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivityService } from '../../app/core/services/activity.service';
import { ApiService } from '../../app/core/services/api.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'patch',
      'deleteRequest',
    ]);

    TestBed.configureTestingModule({
      providers: [ActivityService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(ActivityService);
  });

  it('should get activity records from cart endpoint', () => {
    api.get.and.returnValue(of({ cart: { id: 1, status: 'ACTIVE', items: [] } }));

    service.getActivityRecords().subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/cart');
  });

  it('should create activity by adding cart item', () => {
    api.post.and.returnValue(of({}));
    api.get.and.returnValue(of({ cart: { id: 1, status: 'ACTIVE', items: [] } }));

    service.createActivityRecord([{ contentItemId: 1, quantity: 2 }]).subscribe();
    expect(api.post).toHaveBeenCalledWith('/public/cart/items', {
      productId: 1,
      quantity: 2,
    });
  });

  it('should add content item to active cart', () => {
    api.post.and.returnValue(of({}));
    api.get.and.returnValue(of({ cart: { id: 1, status: 'ACTIVE', items: [] } }));

    service.addContentItemToActivityRecord(1, 2, 3).subscribe();
    expect(api.post).toHaveBeenCalledWith('/public/cart/items', {
      productId: 2,
      quantity: 3,
    });
  });

  it('should update quantity using cart item id', () => {
    api.get.and.returnValues(
      of({
        cart: {
          id: 5,
          status: 'ACTIVE',
          items: [
            {
              id: 99,
              productId: 9,
              quantity: 1,
              unitPriceCents: 100,
              product: { id: 9, name: 'A', priceCents: 100, isActive: true },
            },
          ],
        },
      }),
      of({ cart: { id: 5, status: 'ACTIVE', items: [] } }),
    );
    api.patch.and.returnValue(of({}));

    service.updateQuantity(5, 9, 2).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/public/cart/items/99', {
      quantity: 2,
    });
  });

  it('should remove content item using cart item id', () => {
    api.get.and.returnValue(
      of({
        cart: {
          id: 1,
          status: 'ACTIVE',
          items: [
            {
              id: 77,
              productId: 2,
              quantity: 1,
              unitPriceCents: 100,
              product: { id: 2, name: 'A', priceCents: 100, isActive: true },
            },
          ],
        },
      }),
    );
    api.deleteRequest.and.returnValue(of({}));

    service.removeContentItem(1, 2).subscribe();
    expect(api.deleteRequest).toHaveBeenCalledWith('/public/cart/items/77');
  });

  it('should abandon cart when deleting activity record', () => {
    api.post.and.returnValue(of({ message: 'ok' }));

    service.deleteActivityRecord(7).subscribe();
    expect(api.post).toHaveBeenCalledWith('/public/cart/abandon', {});
  });
});
