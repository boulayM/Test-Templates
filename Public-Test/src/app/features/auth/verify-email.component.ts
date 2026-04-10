import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

  loading = true;
  message = 'Verification en cours...';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.message = 'Token manquant.';
      return;
    }

    this.api
      .get<{ message: string }>(`/auth/verify-email?token=${token}`)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.message = res.message || 'Email verifie.';
        },
        error: () => {
          this.loading = false;
          this.message = 'Verification impossible.';
        },
      });
  }
}
