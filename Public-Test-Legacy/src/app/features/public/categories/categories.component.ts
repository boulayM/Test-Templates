import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { CategoryItem } from '../../../shared/models/category-item.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-categories',
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
  categories: CategoryItem[] = [];
  filteredCategories: CategoryItem[] = [];

  constructor(
    private categoriesService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const query = (params.get('q') || '').trim().toLowerCase();
      this.applyFilter(query);
    });

    this.categoriesService.getCategories().subscribe({
      next: (items) => {
        this.categories = items;
        const query = (this.route.snapshot.queryParamMap.get('q') || '')
          .trim()
          .toLowerCase();
        this.applyFilter(query);
      },
      error: () => this.toast.show('Impossible de charger les categories.'),
    });
  }

  private applyFilter(query: string): void {
    if (!query) {
      this.filteredCategories = [...this.categories];
      return;
    }
    this.filteredCategories = this.categories.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query),
    );
  }

  openCategory(categoryName: string): void {
    this.router.navigate(['/catalog'], { queryParams: { q: categoryName } });
  }
}
