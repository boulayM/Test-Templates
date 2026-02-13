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

  it('should get activity records', () => {
    api.get.and.returnValue(of([]));

    service.getActivityRecords().subscribe();
    expect(api.get).toHaveBeenCalledWith('/account/activity');
  });

  it('should create activity record', () => {
    api.post.and.returnValue(of({}));

    service.createActivityRecord([{ contentItemId: 1, quantity: 2 }]).subscribe();
    expect(api.post).toHaveBeenCalledWith('/account/activity', {
      items: [{ productId: 1, quantity: 2 }],
    });
  });

  it('should add content item to activity record', () => {
    api.post.and.returnValue(of({}));

    service.addContentItemToActivityRecord(1, 2, 3).subscribe();
    expect(api.post).toHaveBeenCalledWith('/account/activity/1/items', {
      productId: 2,
      quantity: 3,
    });
  });

  it('should update quantity by delete then add', () => {
    api.deleteRequest.and.returnValue(of({}));
    api.post.and.returnValue(of({}));

    service.updateQuantity(5, 9, 2).subscribe();
    expect(api.deleteRequest).toHaveBeenCalledWith('/account/activity/5/items/9');
    expect(api.post).toHaveBeenCalledWith('/account/activity/5/items', {
      productId: 9,
      quantity: 2,
    });
  });

  it('should remove content item from activity record', () => {
    api.deleteRequest.and.returnValue(of({}));

    service.removeContentItem(1, 2).subscribe();
    expect(api.deleteRequest).toHaveBeenCalledWith('/account/activity/1/items/2');
  });

  it('should update status', () => {
    api.patch.and.returnValue(of({}));

    service.updateStatus(10, 'PAID').subscribe();
    expect(api.patch).toHaveBeenCalledWith('/account/activity/10/status', {
      status: 'PAID',
    });
  });

  it('should delete activity record', () => {
    api.deleteRequest.and.returnValue(of({}));

    service.deleteActivityRecord(7).subscribe();
    expect(api.deleteRequest).toHaveBeenCalledWith('/account/activity/7');
  });
});
