import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResult } from '../../../core/services/auth.service';
import { AuthMessages } from '../../../shared/messages/auth-messages';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, FormAlertComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly allowedRoles = new Set(['ADMIN', 'LOGISTIQUE', 'COMPTABILITE']);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasError = computed(() => !!this.error());
  readonly alertItems = computed(() => (this.error() ? [this.error() as string] : []));

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Veuillez renseigner un email valide et un mot de passe.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe((result: LoginResult) => {
      this.processLoginResult(result).finally(() => {
        this.loading.set(false);
      });
    });
  }

  private async processLoginResult(result: LoginResult): Promise<void> {
    if (!result.user) {
      if (result.status === 429) {
        this.error.set(AuthMessages.loginLimitReached);
      } else {
        const baseMessage = result.error || AuthMessages.loginInvalid;
        if (result.limitTotal !== undefined && result.remaining !== undefined) {
          const total = result.limitTotal ?? 5;
          const remaining = result.remaining ?? 0;
          if (remaining <= 0) {
            this.error.set(AuthMessages.loginLimitReached);
          } else {
            this.error.set(
              `${baseMessage}. ${AuthMessages.loginRemaining(remaining, total)}`,
            );
          }
        } else {
          this.error.set(baseMessage);
        }
      }
      this.form.patchValue({ email: '', password: '' });
      return;
    }

    if (!this.allowedRoles.has(result.user.role)) {
      await this.auth.initCsrfAfterLogin();
      await this.auth.logout();
      this.error.set(AuthMessages.adminOnly);
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
