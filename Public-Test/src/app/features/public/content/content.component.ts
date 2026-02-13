import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../core/services/activity.service';
import { ContentService } from '../../../core/services/content.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiMessages } from '../../../shared/messages/ui-messages';
import { ActivityRecord } from '../../../shared/models/activity.model';
import { ContentItem } from '../../../shared/models/content-item.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-content',
  imports: [CommonModule],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit {
  contentItems: ContentItem[] = [];
  activeActivityRecordId: number | null = null;
  includedContentItems: number[] = [];

  constructor(
    private contentService: ContentService,
    private activityService: ActivityService,
    public auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadContentItems();
  }

  loadContentItems(): void {
    this.contentService.getContentItems().subscribe({
      next: (res) => (this.contentItems = res),
      error: () => this.toast.show('Impossible de charger le catalogue.'),
    });
  }

  includeContentItem(contentItem: ContentItem): void {
    if (!this.activeActivityRecordId) {
      this.activityService
        .createActivityRecord([{ contentItemId: contentItem.id!, quantity: 1 }])
        .subscribe({
          next: (res: ActivityRecord) => {
            this.activeActivityRecordId = res.id;
            this.includedContentItems.push(contentItem.id!);
            this.toast.show(UiMessages.activity.created(contentItem.name));
          },
          error: () => this.toast.show('Impossible d ajouter le produit au panier.'),
        });
    } else {
      this.activityService
        .addContentItemToActivityRecord(this.activeActivityRecordId, contentItem.id!, 1)
        .subscribe({
          next: () => {
            if (!this.includedContentItems.includes(contentItem.id!)) {
              this.includedContentItems.push(contentItem.id!);
            }
            this.toast.show(UiMessages.activity.addedToActive(contentItem.name));
          },
          error: () => this.toast.show('Impossible d ajouter le produit au panier.'),
        });
    }
  }

  isIncluded(contentItem: ContentItem): boolean {
    return this.includedContentItems.includes(contentItem.id!);
  }
}
