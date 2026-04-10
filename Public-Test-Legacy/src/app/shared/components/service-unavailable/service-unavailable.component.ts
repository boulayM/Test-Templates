import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-service-unavailable',
  imports: [CommonModule, RouterModule],
  templateUrl: './service-unavailable.component.html',
})
export class ServiceUnavailableComponent {
  @Input() title = 'Service indisponible';
  @Input() message =
    'Cette fonctionnalité n est pas configurée dans cet environnement de demonstration.';
  @Input() backRoute = '/home';
}
