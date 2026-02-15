import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AuthMessages } from '../../shared/messages/auth-messages';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { ValidationMessages } from '../../shared/messages/validation-messages';

@Component({
  selector: 'app-login',
  imports: [FormsModule, FormAlertComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = 'admin@example.com';
  password = 'Admin123!';
  loading = false;
  error: string | null = null;
  alertItems: string[] = [];

  constructor(private auth: AuthService) {}

  submit(): void {
    const items: string[] = [];
    if (!this.email.trim()) items.push(ValidationMessages.required);
    if (!this.password.trim()) items.push(ValidationMessages.required);
    if (items.length > 0) {
      this.error = ValidationMessages.genericSubmit;
      this.alertItems = Array.from(new Set(items));
      return;
    }

    this.loading = true;
    this.error = null;
    this.alertItems = [];
    this.auth.clearLoginError();

    this.auth
      .login({
        email: this.email,
        password: this.password,
      })
      .subscribe((user) => {
        this.loading = false;
        if (!user) {
          const code = this.auth.getLastLoginError();
          if (code === 'ADMIN_NOT_ALLOWED' || code === 'ROLE_NOT_ALLOWED') {
            this.error = AuthMessages.userOnly;
          } else {
            const baseMessage =
              this.auth.getLastLoginErrorMessage() || AuthMessages.loginInvalid;
            const limit = this.auth.getLastLoginLimit();
            if (limit.remaining !== null && limit.total !== null) {
              if (limit.remaining <= 0) {
                this.error =
                  AuthMessages.loginLimitReached;
              } else {
                this.error = `${baseMessage}. ${AuthMessages.loginRemaining(limit.remaining, limit.total)}`;
              }
            } else {
              this.error = baseMessage;
            }
            this.alertItems = [this.error];
          }
          this.email = '';
          this.password = '';
        }
      });
  }

}
