import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { authGuard } from '../../../app/core/guards/auth.guard';
import { AuthService } from '../../../app/core/services/auth.service';

function resolveGuardResult(result: any): Promise<any> {
  if (result && typeof result.subscribe === 'function') {
    return new Promise((resolve) => result.subscribe((v: any) => resolve(v)));
  }
  if (result && typeof result.then === 'function') return result;
  return Promise.resolve(result);
}

describe('authGuard', () => {
  it('redirects when not logged in', async () => {
    const auth = { userLoaded$: of(true), isLoggedIn: false };
    const router = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue('redirect'),
    };
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    const val = await resolveGuardResult(result);
    expect(val).toBe('redirect');
  });

  it('allows when logged in', async () => {
    const auth = { userLoaded$: of(true), isLoggedIn: true };
    const router = { createUrlTree: jasmine.createSpy('createUrlTree') };
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    const val = await resolveGuardResult(result);
    expect(val).toBeTrue();
  });
});
