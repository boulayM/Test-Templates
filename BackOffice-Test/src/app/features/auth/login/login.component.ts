import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResult } from '../../../core/services/auth.service';
import { AuthMessages } from '../../../shared/messages/auth-messages';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly allowedRoles = new Set(['ADMIN', 'LOGISTIQUE', 'COMPTABILITE']);
  email = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  submit(): void {
    this.loading = true;
    this.error = null;

    this.auth.login(this.email, this.password).subscribe((result: LoginResult) => {
      this.processLoginResult(result).finally(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  private async processLoginResult(result: LoginResult): Promise<void> {
    if (!result.user) {
      if (result.status === 429) {
        this.error = AuthMessages.loginLimitReached;
      } else {
        const baseMessage = result.error || AuthMessages.loginInvalid;
        if (result.limitTotal !== undefined && result.remaining !== undefined) {
          const total = result.limitTotal ?? 5;
          const remaining = result.remaining ?? 0;
          if (remaining <= 0) {
            this.error = AuthMessages.loginLimitReached;
          } else {
            this.error = `${baseMessage}. ${AuthMessages.loginRemaining(remaining, total)}`;
          }
        } else {
          this.error = baseMessage;
        }
      }
      this.email = '';
      this.password = '';
      this.cdr.detectChanges();
      return;
    }

    if (!this.allowedRoles.has(result.user.role)) {
      await this.auth.initCsrfAfterLogin();
      await this.auth.logout();
      this.error = AuthMessages.adminOnly;
      this.cdr.detectChanges();
      return;
    }

    await this.auth.initCsrfAfterLogin();
    const roleHome =
      result.user.role === 'ADMIN'
        ? '/admin/dashboard'
        : result.user.role === 'LOGISTIQUE'
          ? '/logistique/dashboard'
          : '/comptabilite/dashboard';
    this.router.navigate([roleHome]);
  }
}
