import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { ContentComponent } from '../../app/features/public/content/content.component';
import { ContentService } from '../../app/core/services/content.service';
import { ActivityService } from '../../app/core/services/activity.service';
import { AuthService } from '../../app/core/services/auth.service';

describe('ContentComponent', () => {
  it('should load content on init', () => {
    const contentService = jasmine.createSpyObj('ContentService', [
      'getContentItems',
    ]);
    const activityService = jasmine.createSpyObj('ActivityService', [
      'createActivityRecord',
      'addContentItemToActivityRecord',
    ]);
    contentService.getContentItems.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ContentComponent],
      providers: [
        { provide: ContentService, useValue: contentService },
        { provide: ActivityService, useValue: activityService },
        {
          provide: AuthService,
          useValue: { isAdmin: () => false, isLoggedIn: () => true },
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate']),
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(new Map() as any), snapshot: { queryParamMap: new Map() as any } },
        },
      ],
    });

    const fixture = TestBed.createComponent(ContentComponent);
    fixture.detectChanges();

    expect(contentService.getContentItems).toHaveBeenCalled();
  });

  it('should create activity when no active activity', () => {
    const contentService = jasmine.createSpyObj('ContentService', [
      'getContentItems',
    ]);
    const activityService = jasmine.createSpyObj('ActivityService', [
      'createActivityRecord',
      'addContentItemToActivityRecord',
    ]);
    contentService.getContentItems.and.returnValue(of([]));
    activityService.createActivityRecord.and.returnValue(of({ id: 1 }));

    spyOn(window, 'alert');

    TestBed.configureTestingModule({
      imports: [ContentComponent],
      providers: [
        { provide: ContentService, useValue: contentService },
        { provide: ActivityService, useValue: activityService },
        {
          provide: AuthService,
          useValue: { isAdmin: () => false, isLoggedIn: () => true },
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigate']),
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(new Map() as any), snapshot: { queryParamMap: new Map() as any } },
        },
      ],
    });

    const fixture = TestBed.createComponent(ContentComponent);
    const component = fixture.componentInstance;
    const contentItem = { id: 1, name: 'P', price: 1, isActive: true } as any;

    component.includeContentItem(contentItem);

    expect(activityService.createActivityRecord).toHaveBeenCalled();
  });
});
