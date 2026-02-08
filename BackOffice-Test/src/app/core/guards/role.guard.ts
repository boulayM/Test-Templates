import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data?.['roles'] as string[] | undefined;

  return auth.userLoaded$.pipe(
    filter((loaded) => loaded),
    take(1),
    map(() => {
      if (!roles || roles.length === 0) {
        return true;
      }
      if (auth.user && roles.includes(auth.user.role)) {
        return true;
      }
      return router.createUrlTree(['/access-denied'], { queryParams: { reason: 'role' } });
    }),
  );
};
