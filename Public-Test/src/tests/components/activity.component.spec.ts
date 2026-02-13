import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ActivityComponent } from '../../app/features/account/activity/activity.component';
import { ActivityService } from '../../app/core/services/activity.service';
import { AuthService } from '../../app/core/services/auth.service';

describe('ActivityComponent', () => {
  it('should load activity records on init', () => {
    const activityService = jasmine.createSpyObj('ActivityService', [
      'getActivityRecords',
      'deleteActivityRecord',
      'removeContentItem',
      'updateQuantity',
    ]);
    activityService.getActivityRecords.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ActivityComponent],
      providers: [
        { provide: ActivityService, useValue: activityService },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate']),
        },
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => true, isAdmin: () => false },
        },
      ],
    });

    const fixture = TestBed.createComponent(ActivityComponent);
    fixture.detectChanges();

    expect(activityService.getActivityRecords).toHaveBeenCalled();
  });

  it('should delete activity when confirmed', () => {
    const activityService = jasmine.createSpyObj('ActivityService', [
      'getActivityRecords',
      'deleteActivityRecord',
    ]);
    activityService.getActivityRecords.and.returnValue(of([]));
    activityService.deleteActivityRecord.and.returnValue(of({}));

    spyOn(window, 'confirm').and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [ActivityComponent],
      providers: [
        { provide: ActivityService, useValue: activityService },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate']),
        },
        {
          provide: AuthService,
          useValue: { isLoggedIn: () => true, isAdmin: () => false },
        },
      ],
    });

    const fixture = TestBed.createComponent(ActivityComponent);
    const component = fixture.componentInstance;
    component.activityRecords = [{ id: 1, activityDate: '', status: '', items: [] } as any];

    component.deleteActivityRecord(1);

    expect(activityService.deleteActivityRecord).toHaveBeenCalledWith(1);
  });
});
