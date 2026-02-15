import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Injectable({ providedIn: 'root' })
export class ModalCleanupService {
  constructor(private modalService: NgbModal) {}

  closeModalById(_modalId: string): void {
    this.modalService.dismissAll();
  }

  closeAll(): void {
    this.modalService.dismissAll();
  }
}
