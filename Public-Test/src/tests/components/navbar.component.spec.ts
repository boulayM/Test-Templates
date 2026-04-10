import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { NavbarComponent } from '../../app/shared/components/navbar/navbar.component';
import { AuthService } from '../../app/core/services/auth.service';
import { ContentService } from '../../app/core/services/content.service';
import { User } from '../../app/shared/models/user.model';

describe('NavbarComponent', () => {
  it('should expose current user when auth changes', () => {
    const user$ = new BehaviorSubject<User | null>(null);
    const auth = {
      currentUser$: user$.asObservable(),
      logout: jasmine.createSpy('logout'),
    } as Partial<AuthService>;

    TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ContentService, useValue: { getCategories: () => of([]) } },
      ],
    });

    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    user$.next({ id: 1, role: 'USER', firstName: 'Lea', lastName: 'D', email: 'lea@test.dev' });
    fixture.detectChanges();

    expect(component.currentUser?.firstName).toBe('Lea');
  });

  it('should delegate logout to auth service', () => {
    const user$ = new BehaviorSubject<User | null>(null);
    const auth = {
      currentUser$: user$.asObservable(),
      logout: jasmine.createSpy('logout'),
    } as Partial<AuthService>;

    TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ContentService, useValue: { getCategories: () => of([]) } },
      ],
    });

    const fixture = TestBed.createComponent(NavbarComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.logout();

    expect(auth.logout).toHaveBeenCalled();
  });
});
