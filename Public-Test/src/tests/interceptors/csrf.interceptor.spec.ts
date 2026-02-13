import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { csrfInterceptor } from '../../app/core/interceptors/csrf.interceptor';

describe('csrfInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    document.cookie =
      'csrfToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('should add csrf header for mutating requests', () => {
    document.cookie = 'csrfToken=abc; path=/';

    http.post('/test', {}).subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('x-csrf-token')).toBe('abc');
  });

  it('should not add csrf header for GET requests', () => {
    document.cookie = 'csrfToken=abc; path=/';

    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('x-csrf-token')).toBeFalse();
  });

  it('should not add csrf header if cookie missing', () => {
    http.post('/test', {}).subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('x-csrf-token')).toBeFalse();
  });
});
