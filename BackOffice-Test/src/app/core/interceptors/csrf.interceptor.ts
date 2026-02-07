import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { CsrfService } from '../services/csrf.service';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrf = inject(CsrfService);
  const method = (req.method || 'GET').toUpperCase();

  if (method !== 'GET') {
    const token = csrf.getToken();
    if (token) {
      req = req.clone({
        setHeaders: {
          'X-CSRF-Token': token,
        },
      });
    }
  }

  return next(req);
};
