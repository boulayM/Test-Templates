import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type Payload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AdminImagesService {
  constructor(private api: ApiService) {}

  list(params?: QueryParams) {
    return this.api.get('/admin/images', params, true);
  }

  create(body: Payload) {
    return this.api.post('/admin/images', body);
  }

  delete(id: number) {
    return this.api.deleteRequest('/admin/images/' + id);
  }
}

