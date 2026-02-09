import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recent-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-list.component.html',
  styleUrl: './recent-list.component.scss',
})
export class RecentListComponent {
  @Input() title = '';
}