import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from '../../../app/core/services/api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('builds url with params and cache buster', () => {
    const url = (service as any).buildUrl('/users', { q: 'admin', page: 1 }, true);
    expect(url).toContain('/users');
    expect(url).toContain('q=admin');
    expect(url).toContain('page=1');
    expect(url).toContain('_ts=');
  });

  it('get uses withCredentials', () => {
    service.get('/users').subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/users'));
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
  });
});