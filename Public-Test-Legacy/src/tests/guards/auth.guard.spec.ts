import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from '../../app/core/guards/auth.guard';
import { AuthService } from '../../app/core/services/auth.service';

describe('authGuard', () => {
  it('should block navigation when not logged in', () => {
    const router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue({} as any);
    const auth = { isLoggedIn: () => false } as AuthService;

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/account/profile' } as any),
    ) as any;
    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirect: '/account/profile' },
    });
  });

  it('should allow navigation when logged in', () => {
    const router = jasmine.createSpyObj('Router', ['createUrlTree']);
    const auth = { isLoggedIn: () => true } as AuthService;

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any),
    );
    expect(result).toBeTrue();
  });
});
