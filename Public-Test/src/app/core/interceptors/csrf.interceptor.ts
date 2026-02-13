import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfService } from '../services/csrf.service';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrfService = inject(CsrfService);
  const match = typeof document !== 'undefined'
    ? document.cookie.match(/(^| )csrfToken=([^;]+)/)
    : null;
  const cookieToken = match ? decodeURIComponent(match[2]) : null;
  const csrfToken = cookieToken || csrfService.getToken();

  // Only attach the token to mutating requests.
  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);

  if (!csrfToken || !isMutating) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      'x-csrf-token': csrfToken,
    },
  });

  return next(cloned);
};
