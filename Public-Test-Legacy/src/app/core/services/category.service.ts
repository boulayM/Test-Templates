import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { CategoryItem } from '../../shared/models/category-item.model';

type ApiCategory = {
  id: number;
  name: string;
  slug: string;
};

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private api: ApiService) {}

  getCategories(): Observable<CategoryItem[]> {
    return this.api
      .get<{ data: ApiCategory[] }>('/public/categories?page=1&limit=100')
      .pipe(
        map((res) =>
          (res.data || []).map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
          })),
        ),
      );
  }
}
