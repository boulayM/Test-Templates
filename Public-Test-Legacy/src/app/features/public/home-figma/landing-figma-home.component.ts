import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LandingFigmaFooterComponent } from '../../../shared/components/landing-figma-footer/landing-figma-footer.component';
import { ContentItem } from '../../../shared/models/content-item.model';
import { LandingFigmaNavbarComponent } from '../../../shared/components/landing-figma-navbar/landing-figma-navbar.component';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'app-landing-figma-home',
  imports: [CommonModule, RouterModule, LandingFigmaFooterComponent, LandingFigmaNavbarComponent],
  templateUrl: './landing-figma-home.component.html',
  styleUrls: ['./landing-figma-home.component.scss'],
})
export class LandingFigmaHomeComponent implements OnInit {
  contentItems: ContentItem[] = [];

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    this.contentService.getContentItems().subscribe({
      next: (items) => {
        this.contentItems = items;
      },
      error: () => {
        this.contentItems = [];
      },
    });
  }
}
