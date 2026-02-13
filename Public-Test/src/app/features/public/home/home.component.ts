import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ApiService } from '../../../core/services/api.service';
import { LoginComponent } from '../../auth/login.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ContentItem } from '../../../shared/models/content-item.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    LoginComponent,
    FooterComponent,
    NavbarComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  contentItems: ContentItem[] = [];

  showLoginModal = signal(false);

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.showLoginModal.set(false);

    this.api.get<{ data: ContentItem[] }>('/public/content').subscribe((res) => {
      this.contentItems = res.data || [];
    });
  }

  openLoginModal(): void {
    this.showLoginModal.set(true);
  }

  closeLoginModal(): void {
    this.showLoginModal.set(false);
  }
}
