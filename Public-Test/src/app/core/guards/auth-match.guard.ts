import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authMatchGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  const targetPath = '/' + segments.map((segment) => segment.path).join('/');
  return router.createUrlTree(['/login'], {
    queryParams: { redirect: targetPath || '/dashboard' },
  });
};
