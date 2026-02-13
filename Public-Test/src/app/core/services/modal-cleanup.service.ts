import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ModalCleanupService {
  closeModalById(modalId: string): void {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) {
      return;
    }

    modalEl.classList.remove("is-open");
    modalEl.setAttribute("aria-hidden", "true");
    this.removeBackdrops(false);
  }

  closeAll(): void {
    const modals = Array.from(document.querySelectorAll(".ds-modal.is-open"));
    modals.forEach((modal) => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    });

    this.removeBackdrops(true);
  }

  private removeBackdrops(removeAll: boolean): void {
    const backdrops = Array.from(document.querySelectorAll(".ds-modal-backdrop.is-open"));
    if (backdrops.length === 0) {
      return;
    }

    if (removeAll) {
      backdrops.forEach((backdrop) => backdrop.remove());
      return;
    }

    backdrops[0].remove();
  }
}