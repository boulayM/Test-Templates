import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-alert',
  imports: [CommonModule],
  templateUrl: './form-alert.component.html',
})
export class FormAlertComponent {
  private static uid = 0;
  readonly headingId = `form-alert-title-${++FormAlertComponent.uid}`;
  @Input() visible = false;
  @Input() title = 'Erreur de validation';
  @Input() message = '';
  @Input() items: string[] = [];
}
