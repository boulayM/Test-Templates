import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs/operators';
import { AppPermission, hasPermission } from '../permissions/permission-map';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permission = route.data?.['permission'] as AppPermission | undefined;

  return auth.userLoaded$.pipe(
    filter((loaded) => loaded),
    take(1),
    map(() => {
      if (!permission) {
        return true;
      }
      if (hasPermission(auth.user?.role, permission)) {
        return true;
      }
      return router.createUrlTree(['/access-denied'], {
        queryParams: { reason: 'permission', permission },
      });
    }),
  );
};