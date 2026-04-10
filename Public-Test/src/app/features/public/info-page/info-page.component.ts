import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-info-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './info-page.component.html',
  styleUrls: ['./info-page.component.scss'],
})
export class InfoPageComponent {
  private route = inject(ActivatedRoute);
  private slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('slug') ?? '' },
  );

  readonly pageKey = computed(() => this.slug());
  readonly isContactPage = computed(() => this.pageKey() === 'contact');
  readonly isLegalPage = computed(() => this.pageKey() === 'mentions-legales');
  readonly kicker = computed(() => {
    if (this.isLegalPage()) return 'Informations légales';
    if (this.isContactPage()) return 'Contact';
    return 'Page informative';
  });

  readonly title = computed(() => {
    switch (this.pageKey()) {
      case 'contact':
        return 'Contact';
      case 'mentions-legales':
        return 'Mentions légales';
      case 'cookies':
        return 'Cookies';
      default:
        return 'Information';
    }
  });
}
