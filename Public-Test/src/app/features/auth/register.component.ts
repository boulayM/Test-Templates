import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ModalCleanupService } from '../../core/services/modal-cleanup.service';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { mapBackendError } from '../../shared/utils/backend-error-mapper';
import { ValidationMessages } from '../../shared/messages/validation-messages';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [FormsModule, FormAlertComponent, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  captchaToken = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;
  alertItems: string[] = [];
  captchaEnabled = environment.captchaEnabled;
  captchaSiteKey = environment.captchaSiteKey;

  @Output() registered = new EventEmitter<string>();

  constructor(
    private auth: AuthService,
    private modalCleanup: ModalCleanupService,
  ) {}

  submit(): void {
    const items: string[] = [];
    if (!this.firstName.trim())
      items.push('Prenom: ' + ValidationMessages.required);
    if (!this.lastName.trim())
      items.push('Nom: ' + ValidationMessages.required);
    if (!this.email.trim()) items.push('Email: ' + ValidationMessages.required);
    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      items.push('Email: ' + ValidationMessages.email);
    }
    if (!this.password.trim())
      items.push('Mot de passe: ' + ValidationMessages.required);
    if (this.password && this.password.length < 8) {
      items.push('Mot de passe: ' + ValidationMessages.minLength(8));
    }
    if (this.captchaEnabled && !this.captchaToken.trim()) {
      items.push('Captcha: token requis');
    }
    if (items.length > 0) {
      this.error = ValidationMessages.genericSubmit;
      this.alertItems = Array.from(new Set(items));
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    this.alertItems = [];

    this.auth
      .register({
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        password: this.password,
        captchaToken: this.captchaEnabled ? this.captchaToken : undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          const message =
            res?.message ||
            "Si l'adresse est valide, un email de confirmation vient d'être envoyé. Cliquez sur le lien pour activer votre compte.";
          this.success = message;
          this.registered.emit(message);
          this.modalCleanup.closeModalById('registerModal');
        },
        error: (err) => {
          this.loading = false;
          const mapped = mapBackendError(err, 'Impossible de creer le compte.');
          this.error = mapped.alert.message;
          this.alertItems = mapped.alert.items;
        },
      });
  }
}
