import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { roleGuard } from '../../../app/core/guards/role.guard';
import { AuthService } from '../../../app/core/services/auth.service';

function resolveGuardResult(result: any): Promise<any> {
  if (result && typeof result.subscribe === 'function') {
    return new Promise((resolve) => result.subscribe((v: any) => resolve(v)));
  }
  if (result && typeof result.then === 'function') return result;
  return Promise.resolve(result);
}

describe('roleGuard', () => {
  it('allows when role matches', async () => {
    const auth = { userLoaded$: of(true), user: { role: 'ADMIN' } };
    const router = { createUrlTree: jasmine.createSpy('createUrlTree') };
    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));
    const val = await resolveGuardResult(result);
    expect(val).toBeTrue();
  });

  it('redirects when role does not match', async () => {
    const auth = { userLoaded$: of(true), user: { role: 'USER' } };
    const router = {
      createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue('redirect'),
    };
    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() => roleGuard(route, state));
    const val = await resolveGuardResult(result);
    expect(val).toBe('redirect');
  });
});
