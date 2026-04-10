import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ContentService } from '../../app/core/services/content.service';
import { ApiService } from '../../app/core/services/api.service';

describe('ContentService', () => {
  let service: ContentService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'patch',
      'deleteRequest',
    ]);

    TestBed.configureTestingModule({
      providers: [ContentService, { provide: ApiService, useValue: api }],
    });

    service = TestBed.inject(ContentService);
  });

  it('should get content items from public products endpoint', () => {
    api.get.and.returnValue(of({ data: [] }));

    service.getContentItems().subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/products?page=1&limit=20&activeOnly=true');
  });

  it('should get content item by id from public products endpoint', () => {
    api.get.and.returnValue(
      of({ product: { id: 3, name: 'P', priceCents: 1000, isActive: true } }),
    );

    service.getContentItemById(3).subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/products/3');
  });

  it('should reject create on public API', (done) => {
    service
      .createContentItem({
        name: 'Test',
        price: 10,
        isActive: true,
      })
      .subscribe({
        next: () => fail('Expected error'),
        error: (err: Error) => {
          expect(err.message).toContain('Not supported on public API');
          expect(api.post).not.toHaveBeenCalled();
          done();
        },
      });
  });
});
