import {
  Component,
  computed,
  signal,
  OnInit,
  OnDestroy,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from '../../../features/auth/login.component';
import { Subscription } from 'rxjs';
import { User } from '../../../shared/models/user.model';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterModule,
    FormsModule,
    LoginComponent,
    NgbCollapseModule,
    NgbDropdownModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  user = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.user());
  isCollapsed = signal(true);
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
    private modalService: NgbModal,
  ) {}

  ngOnInit(): void {
    this.authSub = this.auth.currentUser$.subscribe((user) => {
      this.user.set(user);
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  closeMenu(): void {
    this.isCollapsed.set(true);
  }

  openLoginModal(content: TemplateRef<unknown>): void {
    this.closeMenu();
    this.modalService.open(content, {
      centered: true,
      size: 'lg',
      backdrop: true,
    });
  }

  runSearch(): void {
    const query = this.searchQuery().trim();
    this.router
      .navigate(['/catalog'], {
        queryParams: query ? { q: query } : {},
      })
      .then(() => this.closeMenu());
  }

  goToCategory(categoryName: string): void {
    this.router
      .navigate(['/catalog'], {
        queryParams: categoryName ? { q: categoryName } : {},
      })
      .then(() => this.closeMenu());
  }

  navigate(path: string) {
    this.router.navigate([path]).then(() => this.closeMenu());
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/home']);
    this.closeMenu();
    this.modalService.dismissAll();
  }
}
