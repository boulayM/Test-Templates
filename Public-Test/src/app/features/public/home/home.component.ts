import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LoginComponent } from '../../auth/login.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ContentItem } from '../../../shared/models/content-item.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, LoginComponent, FooterComponent, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  contentItems: ContentItem[] = [];
  showLoginModal = signal(false);

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.showLoginModal.set(false);
    this.contentService.getContentItems().subscribe((items) => {
      this.contentItems = items;
    });
  }

  openLoginModal(): void {
    this.showLoginModal.set(true);
  }

  closeLoginModal(): void {
    this.showLoginModal.set(false);
  }
}
