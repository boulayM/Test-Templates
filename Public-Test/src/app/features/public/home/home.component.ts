import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { ContentItem } from '../../../shared/models/content-item.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FooterComponent, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  contentItems: ContentItem[] = [];

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getContentItems().subscribe((items) => {
      this.contentItems = items;
    });
  }
}
