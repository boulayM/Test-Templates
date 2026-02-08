import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { csrfInterceptor } from '../../../app/core/interceptors/csrf.interceptor';
import { CsrfService } from '../../../app/core/services/csrf.service';

function resolveInterceptor(result: any): Promise<any> {
  if (result && typeof result.subscribe === 'function') {
    return new Promise((resolve) => result.subscribe((v: any) => resolve(v)));
  }
  if (result && typeof result.then === 'function') return result;
  return Promise.resolve(result);
}

describe('csrfInterceptor', () => {
  it('adds csrf header on non GET', async () => {
    const csrf = { getToken: () => 'token-123' };

    TestBed.configureTestingModule({
      providers: [{ provide: CsrfService, useValue: csrf }],
    });

    const req = new HttpRequest('POST', '/api/users', {});
    const result = TestBed.runInInjectionContext(() =>
      csrfInterceptor(req, (r) => {
        expect(r.headers.get('X-CSRF-Token')).toBe('token-123');
        return of(new HttpResponse({ status: 200 }));
      }),
    );

    await resolveInterceptor(result);
  });

  it('does not add header on GET', async () => {
    const csrf = { getToken: () => 'token-123' };

    TestBed.configureTestingModule({
      providers: [{ provide: CsrfService, useValue: csrf }],
    });

    const req = new HttpRequest('GET', '/api/users');
    const result = TestBed.runInInjectionContext(() =>
      csrfInterceptor(req, (r) => {
        expect(r.headers.get('X-CSRF-Token')).toBeNull();
        return of(new HttpResponse({ status: 200 }));
      }),
    );

    await resolveInterceptor(result);
  });
});