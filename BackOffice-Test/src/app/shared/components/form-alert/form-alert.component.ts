import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-alert',
  imports: [CommonModule],
  templateUrl: './form-alert.component.html',
  styleUrl: './form-alert.component.scss',
})
export class FormAlertComponent {
  @Input() visible = false;
  @Input() title = 'Validation error';
  @Input() message = '';
  @Input() items: string[] = [];
}

