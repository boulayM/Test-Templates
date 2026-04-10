import { Component, DestroyRef, inject } from '@angular/core';

import { NavigationStart, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalCleanupService } from './core/services/modal-cleanup.service';
import { ToastService } from './shared/services/toast.service';

@Component({
    selector: 'app-root',
    imports: [RouterModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private modalCleanup = inject(ModalCleanupService);
  toast = inject(ToastService);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.modalCleanup.closeAll();
      });
  }
}
