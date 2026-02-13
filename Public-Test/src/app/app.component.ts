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
  toast = inject(ToastService);

  constructor(
    private router: Router,
    private modalCleanup: ModalCleanupService,
  ) {
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
