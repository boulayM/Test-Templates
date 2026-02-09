import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-grid.component.html',
  styleUrl: './dashboard-grid.component.scss',
})
export class DashboardGridComponent {
  @Input() title = 'Dashboard';
  @Input() subtitle = '';
}