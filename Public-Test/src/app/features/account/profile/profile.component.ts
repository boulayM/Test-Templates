import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);

  user = signal<User | null>(null);

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((u) => {
      this.user.set(u);
    });
  }
}
