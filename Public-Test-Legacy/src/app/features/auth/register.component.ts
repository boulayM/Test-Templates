import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ModalCleanupService } from '../../core/services/modal-cleanup.service';
import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';
import { mapBackendError } from '../../shared/utils/backend-error-mapper';
import { ValidationMessages } from '../../shared/messages/validation-messages';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, FormAlertComponent, RouterModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    captchaToken: [''],
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly alertItems = signal<string[]>([]);
  readonly hasError = computed(() => !!this.error());
  readonly captchaEnabled = environment.captchaEnabled;
  readonly captchaSiteKey = environment.captchaSiteKey;

  @Output() registered = new EventEmitter<string>();

  constructor(
    private auth: AuthService,
    private modalCleanup: ModalCleanupService,
  ) {}

  submit(): void {
    this.form.markAllAsTouched();
    const items: string[] = [];
    const { firstName, lastName, email, password, captchaToken } =
      this.form.getRawValue();
    if (!firstName.trim())
      items.push('Prenom: ' + ValidationMessages.required);
    if (!lastName.trim())
      items.push('Nom: ' + ValidationMessages.required);
    if (!email.trim()) items.push('Email: ' + ValidationMessages.required);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      items.push('Email: ' + ValidationMessages.email);
    }
    if (!password.trim())
      items.push('Mot de passe: ' + ValidationMessages.required);
    if (password && password.length < 8) {
      items.push('Mot de passe: ' + ValidationMessages.minLength(8));
    }
    if (this.captchaEnabled && !captchaToken.trim()) {
      items.push('Captcha: token requis');
    }
    if (items.length > 0) {
      this.error.set(ValidationMessages.genericSubmit);
      this.alertItems.set(Array.from(new Set(items)));
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.alertItems.set([]);

    this.auth
      .register({
        firstName,
        lastName,
        email,
        password,
        captchaToken: this.captchaEnabled ? captchaToken : undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          const message =
            res?.message ||
            "Si l'adresse est valide, un email de confirmation vient d'être envoyé. Cliquez sur le lien pour activer votre compte.";
          this.success.set(message);
          this.registered.emit(message);
          this.modalCleanup.closeModalById('registerModal');
        },
        error: (err) => {
          this.loading.set(false);
          const mapped = mapBackendError(err, 'Impossible de creer le compte.');
          this.error.set(mapped.alert.message);
          this.alertItems.set(mapped.alert.items);
        },
      });
  }
}
