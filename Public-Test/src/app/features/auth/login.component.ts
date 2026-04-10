import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { AuthMessages } from '../../shared/messages/auth-messages';
import { ValidationMessages } from '../../shared/messages/validation-messages';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormAlertComponent,
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly alertItems = signal<string[]>([]);
  readonly hasError = computed(() => !!this.error());
  @Input() embedded = false;
  @Output() loggedIn = new EventEmitter<void>();

  submit(): void {
    this.form.markAllAsTouched();
    const items: string[] = [];
    const { email, password } = this.form.getRawValue();
    if (!email.trim()) items.push(ValidationMessages.required);
    if (!password.trim()) items.push(ValidationMessages.required);
    if (items.length > 0) {
      this.error.set(ValidationMessages.genericSubmit);
      this.alertItems.set(Array.from(new Set(items)));
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.alertItems.set([]);
    this.auth.clearLoginError();

    this.auth
      .login({ email, password }, { redirectToProfile: !this.embedded })
      .subscribe((user) => {
        this.loading.set(false);
        if (!user) {
          const code = this.auth.getLastLoginError();
          if (code === 'ADMIN_NOT_ALLOWED' || code === 'ROLE_NOT_ALLOWED') {
            this.error.set(AuthMessages.userOnly);
          } else {
            const baseMessage =
              this.auth.getLastLoginErrorMessage() || AuthMessages.loginInvalid;
            const limit = this.auth.getLastLoginLimit();
            if (limit.remaining !== null && limit.total !== null) {
              if (limit.remaining <= 0) {
                this.error.set(AuthMessages.loginLimitReached);
              } else {
                this.error.set(
                  `${baseMessage}. ${AuthMessages.loginRemaining(limit.remaining, limit.total)}`,
                );
              }
            } else {
              this.error.set(baseMessage);
            }
          }
          this.alertItems.set(this.error() ? [this.error() as string] : []);
          this.form.patchValue({ password: '' });
          return;
        }

        this.loggedIn.emit();
        if (!this.embedded) {
          this.router.navigate(['/home']);
        }
      });
  }
}
