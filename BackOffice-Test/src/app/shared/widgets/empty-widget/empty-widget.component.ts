import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-widget.component.html',
  styleUrl: './empty-widget.component.scss',
})
export class EmptyWidgetComponent {
  @Input() message = 'No data available.';
}