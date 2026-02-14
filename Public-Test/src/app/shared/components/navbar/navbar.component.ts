import {
  Component,
  computed,
  signal,
  OnInit,
  OnDestroy,
  ElementRef,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from '../../../features/auth/login.component';
import { Subscription } from 'rxjs';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, FormsModule, LoginComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  user = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.user());
  isOpen = signal(false);
  showLoginModal = signal(false);
  showCategoriesMenu = signal(false);
  searchQuery = signal('');
  readonly categoryQuickLinks = [
    'Books',
    'Beauty',
    'Fashion',
    'Electronics',
  ];

  private authSub?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private hostRef: ElementRef<HTMLElement>,
  ) {}

  ngOnInit(): void {
    this.authSub = this.auth.currentUser$.subscribe((user) => {
      this.user.set(user);
      if (user) {
        this.closeLoginModal();
      }
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  toggleMenu(): void {
    this.isOpen.set(!this.isOpen());
  }

  closeMenu(): void {
    this.isOpen.set(false);
    this.showCategoriesMenu.set(false);
  }

  openLoginModal(): void {
    this.showLoginModal.set(true);
    this.closeMenu();
  }

  closeLoginModal(): void {
    this.showLoginModal.set(false);
  }

  runSearch(): void {
    const query = this.searchQuery().trim();
    this.router
      .navigate(['/catalog'], {
        queryParams: query ? { q: query } : {},
      })
      .then(() => this.closeMenu());
  }

  toggleCategoriesMenu(): void {
    this.showCategoriesMenu.set(!this.showCategoriesMenu());
  }

  closeCategoriesMenu(): void {
    this.showCategoriesMenu.set(false);
  }

  goToCategory(categoryName: string): void {
    this.router
      .navigate(['/catalog'], {
        queryParams: categoryName ? { q: categoryName } : {},
      })
      .then(() => {
        this.showCategoriesMenu.set(false);
        this.closeMenu();
      });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showCategoriesMenu()) {
      return;
    }
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (!this.hostRef.nativeElement.contains(target)) {
      this.closeCategoriesMenu();
    }
  }

  navigate(path: string) {
    this.router.navigate([path]).then(() => this.closeMenu());
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/home']);
    this.closeMenu();
    this.closeLoginModal();
  }
}
