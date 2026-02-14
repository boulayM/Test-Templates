import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-service-unavailable',
  imports: [CommonModule, RouterModule],
  templateUrl: './service-unavailable.component.html',
  styleUrls: ['./service-unavailable.component.scss'],
})
export class ServiceUnavailableComponent {
  @Input() title = 'Service indisponible';
  @Input() message = 'Cette fonctionnalite n est pas configuree dans cet environnement de demonstration.';
  @Input() backRoute = '/home';
}
