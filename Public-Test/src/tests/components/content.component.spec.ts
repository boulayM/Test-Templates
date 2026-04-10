import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';

import { ContentComponent } from '../../app/features/public/content/content.component';
import { ContentService } from '../../app/core/services/content.service';
import { ActivityService } from '../../app/core/services/activity.service';
import { AuthService } from '../../app/core/services/auth.service';
import { ToastService } from '../../app/shared/services/toast.service';
import { User } from '../../app/shared/models/user.model';

describe('ContentComponent', () => {
  it('should load products and categories on init', () => {
    const contentService = jasmine.createSpyObj('ContentService', ['getProducts', 'getCategories']);
    const activityService = jasmine.createSpyObj('ActivityService', ['addProduct']);
    const authUser$ = new BehaviorSubject<User | null>(null);
    const authService = {
      currentUser$: authUser$.asObservable(),
      isLoggedIn: () => false,
      logout: jasmine.createSpy('logout'),
    };
    contentService.getProducts.and.returnValue(of([]));
    contentService.getCategories.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ContentComponent, RouterTestingModule],
      providers: [
        { provide: ContentService, useValue: contentService },
        { provide: ActivityService, useValue: activityService },
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['show']) },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    });

    const fixture = TestBed.createComponent(ContentComponent);
    fixture.detectChanges();

    expect(contentService.getProducts).toHaveBeenCalled();
    expect(contentService.getCategories).toHaveBeenCalled();
  });

  it('should add product to cart', () => {
    const contentService = jasmine.createSpyObj('ContentService', ['getProducts', 'getCategories']);
    const activityService = jasmine.createSpyObj('ActivityService', ['addProduct']);
    const authUser$ = new BehaviorSubject<User | null>({ id: 1, role: 'USER' } as User);
    const toastService = jasmine.createSpyObj('ToastService', ['show']);
    const authService = {
      currentUser$: authUser$.asObservable(),
      isLoggedIn: () => true,
      logout: jasmine.createSpy('logout'),
    };
    contentService.getProducts.and.returnValue(of([]));
    contentService.getCategories.and.returnValue(of([]));
    activityService.addProduct.and.returnValue(of({}));

    TestBed.configureTestingModule({
      imports: [ContentComponent, RouterTestingModule],
      providers: [
        { provide: ContentService, useValue: contentService },
        { provide: ActivityService, useValue: activityService },
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toastService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    });

    const fixture = TestBed.createComponent(ContentComponent);
    const component = fixture.componentInstance;
    const product = { id: 1, name: 'Produit', isActive: true } as any;

    component.addToCart(product);

    expect(activityService.addProduct).toHaveBeenCalledWith(1, 1);
    expect(toastService.show).toHaveBeenCalled();
  });
});
