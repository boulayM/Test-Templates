import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgbCollapseModule, NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from '../../../core/services/auth.service';
import { ContentService } from '../../../core/services/content.service';
import { Category } from '../../models/product.model';
import { User } from '../../models/user.model';
import { LoginComponent } from '../../../features/auth/login.component';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, FormsModule, RouterModule, LoginComponent, NgbModalModule, NgbCollapseModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private contentService = inject(ContentService);
  private router = inject(Router);
  private modalService = inject(NgbModal);
  @ViewChild('loginModalContent') loginModalContent?: TemplateRef<unknown>;
  categories: Category[] = [];
  currentUser: User | null = null;
  searchTerm = '';
  isPrimaryCollapsed = true;
  private modalRef: NgbModalRef | null = null;
  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    this.contentService.getCategories().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => undefined,
    });

    this.subscriptions.add(
      this.auth.currentUser$.subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.closeLoginModal();
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.closeLoginModal();
    this.subscriptions.unsubscribe();
  }

  submitSearch(): void {
    this.closePrimaryMenu();
    this.router.navigate(['/catalog'], {
      queryParams: this.searchTerm.trim() ? { q: this.searchTerm.trim() } : undefined,
    });
  }

  togglePrimaryMenu(): void {
    this.isPrimaryCollapsed = !this.isPrimaryCollapsed;
  }

  closePrimaryMenu(): void {
    this.isPrimaryCollapsed = true;
  }

  openLoginModal(): void {
    this.closePrimaryMenu();
    if (!this.loginModalContent || this.modalRef) return;
    this.modalRef = this.modalService.open(this.loginModalContent, {
      centered: true,
      size: 'lg',
      scrollable: true,
    });
    this.modalRef.result.finally(() => {
      this.modalRef = null;
    });
  }

  closeLoginModal(): void {
    this.modalRef?.close();
    this.modalRef = null;
  }

  logout(): void {
    this.closePrimaryMenu();
    this.auth.logout();
  }
}
