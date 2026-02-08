import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthMessages } from '../../messages/auth-messages';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.scss',
})
export class ErrorPageComponent {
  private route = inject(ActivatedRoute);

  get reason(): string {
    return (
      this.route.snapshot.queryParamMap.get('reason') ||
      this.route.snapshot.data?.['reason'] ||
      'generic'
    );
  }

  get message(): string {
    switch (this.reason) {
      case 'auth':
        return AuthMessages.accessDeniedAuth;
      case 'admin':
      case 'role':
        return AuthMessages.accessDeniedRole;
      case 'rate':
        return AuthMessages.loginLimitReached;
      case 'server':
        return AuthMessages.serverError;
      case 'not-found':
        return AuthMessages.notFound;
      default:
        return AuthMessages.genericError;
    }
  }
}
