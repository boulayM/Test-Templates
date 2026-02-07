import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.userLoaded$.pipe(
    filter((loaded) => loaded),
    take(1),
    map(() => {
      if (!auth.isLoggedIn) {
        return router.createUrlTree(['/access-denied'], { queryParams: { reason: 'auth' } });
      }
      return true;
    }),
  );
};
