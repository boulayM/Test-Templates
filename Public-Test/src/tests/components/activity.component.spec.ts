import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ActivityComponent } from '../../app/features/account/activity/activity.component';
import { ActivityService } from '../../app/core/services/activity.service';

describe('ActivityComponent', () => {
  it('should load cart on init', () => {
    const activityService = jasmine.createSpyObj('ActivityService', [
      'getCart',
      'removeItem',
      'updateQuantity',
      'validateCoupon',
    ]);
    activityService.getCart.and.returnValue(of({ id: 1, status: 'ACTIVE', items: [] }));

    TestBed.configureTestingModule({
      imports: [ActivityComponent, RouterTestingModule],
      providers: [
        { provide: ActivityService, useValue: activityService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    });

    const fixture = TestBed.createComponent(ActivityComponent);
    fixture.detectChanges();

    expect(activityService.getCart).toHaveBeenCalled();
  });

  it('should remove item from cart', () => {
    const activityService = jasmine.createSpyObj('ActivityService', [
      'getCart',
      'removeItem',
      'updateQuantity',
      'validateCoupon',
    ]);
    activityService.getCart.and.returnValue(of({ id: 1, status: 'ACTIVE', items: [] }));
    activityService.removeItem.and.returnValue(of({ message: 'ok' }));

    TestBed.configureTestingModule({
      imports: [ActivityComponent, RouterTestingModule],
      providers: [
        { provide: ActivityService, useValue: activityService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    });

    const fixture = TestBed.createComponent(ActivityComponent);
    const component = fixture.componentInstance;
    component.cart = {
      id: 1,
      status: 'ACTIVE',
      items: [{ id: 8, productId: 2, quantity: 1, unitPriceCents: 1000, currency: 'EUR', product: {} as any }],
    };

    component.removeItem(8);

    expect(activityService.removeItem).toHaveBeenCalledWith(8);
  });
});
