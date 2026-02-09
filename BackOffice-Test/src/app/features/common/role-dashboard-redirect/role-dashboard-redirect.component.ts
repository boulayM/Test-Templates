import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-role-dashboard-redirect',
  standalone: true,
  template: '',
})
export class RoleDashboardRedirectComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const role = this.auth.user?.role;
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    if (role === 'LOGISTIQUE') {
      this.router.navigate(['/logistique/dashboard']);
      return;
    }
    if (role === 'COMPTABILITE') {
      this.router.navigate(['/comptabilite/dashboard']);
      return;
    }
    this.router.navigate(['/access-denied'], { queryParams: { reason: 'role' } });
  }
}