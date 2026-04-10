import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalCleanupService {
  closeModalById(modalId: string): void {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) {
      return;
    }

    modalEl.classList.remove('is-open', 'show', 'd-block');
    modalEl.setAttribute('aria-hidden', 'true');
    if ((modalEl as HTMLElement).style) {
      (modalEl as HTMLElement).style.display = 'none';
    }
    this.removeBackdrops(false);
  }

  closeAll(): void {
    const modals = Array.from(document.querySelectorAll('.modal.show'));
    modals.forEach((modal) => {
      modal.classList.remove('is-open', 'show', 'd-block');
      modal.setAttribute('aria-hidden', 'true');
    });

    this.removeBackdrops(true);
  }

  private removeBackdrops(removeAll: boolean): void {
    const backdrops = Array.from(document.querySelectorAll('.modal-backdrop'));
    if (backdrops.length > 0 && removeAll) {
      backdrops.forEach((backdrop) => backdrop.remove());
    } else if (backdrops.length > 0) {
      backdrops[0].remove();
    }

    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }
}
