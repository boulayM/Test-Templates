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

  it('should get content items', () => {
    api.get.and.returnValue(of([]));

    service.getContentItems().subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/content');
  });

  it('should get content item by id', () => {
    api.get.and.returnValue(of({}));

    service.getContentItemById(3).subscribe();
    expect(api.get).toHaveBeenCalledWith('/public/content/3');
  });

  it('should create content item', () => {
    api.post.and.returnValue(of({}));

    service
      .createContentItem({
        name: 'Test',
        price: 10,
        isActive: true,
      })
      .subscribe();
    expect(api.post).toHaveBeenCalledWith('/public/content', {
      name: 'Test',
      price: 10,
      isActive: true,
    });
  });

  it('should update content item', () => {
    api.patch.and.returnValue(of({}));

    service.updateContentItem(5, { name: 'Updated' }).subscribe();
    expect(api.patch).toHaveBeenCalledWith('/public/content/5', { name: 'Updated' });
  });

  it('should delete content item', () => {
    api.deleteRequest.and.returnValue(of({}));

    service.deleteContentItem(9).subscribe();
    expect(api.deleteRequest).toHaveBeenCalledWith('/public/content/9');
  });
});
