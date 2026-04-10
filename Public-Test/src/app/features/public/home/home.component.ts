import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ContentService } from '../../../core/services/content.service';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  private contentService = inject(ContentService);
  @ViewChild('carouselViewport') carouselViewport?: ElementRef<HTMLDivElement>;

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly canScrollPrev = signal(false);
  readonly canScrollNext = signal(false);
  readonly placeholderImage = '/assets/image-placeholder.svg';

  ngOnInit(): void {
    this.contentService.getProducts({ activeOnly: true, limit: 100 }).subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
        requestAnimationFrame(() => this.resetCarouselPosition());
      },
      error: () => {
        this.error.set('Impossible de charger les produits de la vitrine.');
        this.loading.set(false);
      },
    });

  }

  get featuredProduct(): Product | null {
    return this.products()[0] || null;
  }

  get carouselProducts(): Product[] {
    return this.products().slice(1);
  }

  get carouselSourceProducts(): Product[] {
    if (this.carouselProducts.length > 0) {
      return this.carouselProducts;
    }
    return this.featuredProduct ? [this.featuredProduct] : [];
  }

  get hasCarouselControls(): boolean {
    return this.carouselSourceProducts.length > 1;
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.updateCarouselControls());
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateCarouselControls();
  }

  previousSlide(): void {
    this.scrollCarousel(-1);
  }

  nextSlide(): void {
    this.scrollCarousel(1);
  }

  updateCarouselControls(): void {
    const viewport = this.carouselViewport?.nativeElement;
    if (!viewport) return;

    const horizontal = !this.isMobileViewport();
    const currentPosition = horizontal ? viewport.scrollLeft : viewport.scrollTop;
    const maxPosition = horizontal
      ? viewport.scrollWidth - viewport.clientWidth
      : viewport.scrollHeight - viewport.clientHeight;
    const tolerance = 2;

    this.canScrollPrev.set(currentPosition > tolerance);
    this.canScrollNext.set(currentPosition < maxPosition - tolerance);
  }

  private scrollCarousel(direction: -1 | 1): void {
    const viewport = this.carouselViewport?.nativeElement;
    if (!viewport) return;

    const firstCard = viewport.querySelector<HTMLElement>('.carousel-card');
    const track = viewport.querySelector<HTMLElement>('.carousel-track');
    const gapValue = track ? parseFloat(getComputedStyle(track).gap || '0') : 0;
    const horizontal = !this.isMobileViewport();
    const step = firstCard
      ? horizontal
        ? firstCard.getBoundingClientRect().width + gapValue
        : firstCard.getBoundingClientRect().height + gapValue
      : horizontal
        ? viewport.clientWidth
        : viewport.clientHeight;

    viewport.scrollBy({
      left: horizontal ? direction * step : 0,
      top: horizontal ? 0 : direction * step,
      behavior: 'smooth',
    });

    window.setTimeout(() => this.updateCarouselControls(), 250);
  }

  private resetCarouselPosition(): void {
    const viewport = this.carouselViewport?.nativeElement;
    if (!viewport) return;

    viewport.scrollTo({ left: 0, top: 0, behavior: 'auto' });
    this.updateCarouselControls();
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImage;
  }
}
