import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from '../../app/shared/components/navbar/navbar.component';
import { AuthService } from '../../app/core/services/auth.service';
import { User } from '../../app/shared/models/user.model';

describe('NavbarComponent', () => {
  it('should update isLoggedIn when user changes', () => {
    const user$ = new BehaviorSubject<User | null>(null);
    const auth = {
      currentUser$: user$.asObservable(),
      logout: jasmine.createSpy('logout'),
    } as Partial<AuthService>;

    TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
      ],
    });

    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    const component = fixture.componentInstance;
    user$.next({ id: 1, role: 'ADMIN' } as User);
    fixture.detectChanges();

    expect(component.isLoggedIn()).toBeTrue();
  });

  it('should call logout and navigate home', () => {
    const user$ = new BehaviorSubject<User | null>(null);
    const auth = {
      currentUser$: user$.asObservable(),
      logout: jasmine.createSpy('logout'),
    } as Partial<AuthService>;

    TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
      ],
    });

    const fixture = TestBed.createComponent(NavbarComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.logout();

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });
});
