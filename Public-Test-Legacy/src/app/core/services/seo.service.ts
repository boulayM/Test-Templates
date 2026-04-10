import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

type LegacySeoRouteData = {
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
    private router: Router,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  init(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.applyFromCurrentRoute();
    });

    this.applyFromCurrentRoute();
  }

  private applyFromCurrentRoute(): void {
    const route = this.getDeepestRoute(this.router.routerState.snapshot.root);
    const legacy = route.data?.['seo'] as LegacySeoRouteData | undefined;

    const title =
      legacy?.title ??
      (typeof route.title === 'string' ? route.title : 'Ma Boutique');
    const description =
      legacy?.description ??
      (route.data?.['description'] as string | undefined) ??
      'Ma Boutique - catalogue et parcours client e-commerce.';
    const robots = legacy
      ? legacy.indexable === false
        ? 'noindex,nofollow'
        : 'index,follow'
      : ((route.data?.['robots'] as string | undefined) ?? 'index,follow');

    const canonicalPath = legacy?.canonicalPath;
    const canonicalUrl = this.toAbsoluteCanonical(canonicalPath);
    const imageUrl = `${this.document.location.origin}/assets/og-default.svg`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: robots });

    this.upsertCanonical(canonicalUrl);

    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });

    this.upsertJsonLd(robots === 'index,follow', canonicalUrl, title);
  }

  private getDeepestRoute(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

  private toAbsoluteCanonical(path?: string): string {
    const origin = this.document.location.origin;
    const pathname = path || this.router.url.split('?')[0] || '/';
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

  private upsertJsonLd(indexable: boolean, canonicalUrl: string, pageTitle: string): void {
    const existing = this.document.getElementById('app-jsonld-seo');
    if (!indexable) {
      if (existing) existing.remove();
      return;
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Ma Boutique',
      url: this.document.location.origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.document.location.origin}/catalog?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
      inLanguage: 'fr-FR',
      mainEntityOfPage: canonicalUrl,
      headline: pageTitle,
    };

    let script = existing as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'app-jsonld-seo';
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.text = JSON.stringify(schema);
  }
}
