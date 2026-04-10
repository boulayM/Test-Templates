import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { FormAlertComponent } from '../../shared/components/form-alert/form-alert.component';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, FormAlertComponent, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  readonly alertItems = signal(['Pour cette demo l inscription n est pas disponible.']);
  readonly hasError = computed(() => true);

  constructor() {
    this.form.disable();
  }
}
