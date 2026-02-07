import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.scss',
})
export class AdminNavbarComponent {
  user = computed(() => this.auth.user);
  isLoggedIn = computed(() => !!this.auth.user);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async handleLogout(): Promise<void> {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
