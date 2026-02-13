import {
  Component,
  computed,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  user = signal<User | null>(null);
  isLoggedIn = computed(() => !!this.user());
  isOpen = signal(false);

  private authSub?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authSub = this.auth.currentUser$.subscribe((user) =>
      this.user.set(user),
    );
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

  toggleMenu(): void {
    this.isOpen.set(!this.isOpen());
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  navigate(path: string) {
    this.router.navigate([path]).then(() => this.closeMenu());
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/home']);
    this.closeMenu();
  }
}
