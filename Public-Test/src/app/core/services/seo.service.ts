import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export type SeoRouteData = {
  title: string;
  description: string;
  indexable?: boolean;
  canonicalPath?: string;
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  bindToRouter(router: Router, activatedRoute: ActivatedRoute): void {
    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const route = this.getDeepestRoute(activatedRoute);
      const seo = route.snapshot.data?.['seo'] as SeoRouteData | undefined;
      if (!seo) {
        return;
      }
      this.apply(seo);
    });

    const initialRoute = this.getDeepestRoute(activatedRoute);
    const initialSeo = initialRoute.snapshot.data?.['seo'] as SeoRouteData | undefined;
    if (initialSeo) {
      this.apply(initialSeo);
    }
  }

  private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

  private apply(seo: SeoRouteData): void {
    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });

    const robots = seo.indexable === false ? 'noindex, nofollow' : 'index, follow';
    this.meta.updateTag({ name: 'robots', content: robots });

    const canonicalUrl = this.toAbsoluteCanonical(seo.canonicalPath);
    this.upsertCanonical(canonicalUrl);

    this.meta.updateTag({ property: 'og:title', content: seo.title });
    this.meta.updateTag({ property: 'og:description', content: seo.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
  }

  private toAbsoluteCanonical(path?: string): string {
    const origin = this.document.location.origin;
    const pathname = path || this.document.location.pathname;
    return `${origin}${pathname}`;
  }

  private upsertCanonical(url: string): void {
    let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
