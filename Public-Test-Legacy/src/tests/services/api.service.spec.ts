import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from '../../app/core/services/api.service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET with base url and credentials', () => {
    service.get('/ping').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/ping`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
  });

  it('should append cache buster when noCache is true', () => {
    service.get('/public/content', true).subscribe();

    const req = httpMock.expectOne((r) =>
      r.url.startsWith(`${environment.apiUrl}/public/content`),
    );
    expect(req.request.urlWithParams).toContain('_ts=');
  });

  it('should POST with base url and credentials', () => {
    service.post('/public/content', { name: 'Test' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/public/content`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
  });

  it('should PATCH with base url and credentials', () => {
    service.patch('/public/content/1', { name: 'Test' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/public/content/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.withCredentials).toBeTrue();
  });

  it('should DELETE with base url and credentials', () => {
    service.deleteRequest('/public/content/1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/public/content/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBeTrue();
  });
});
