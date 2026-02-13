import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { ContentService } from '../../../core/services/content.service';
import { AuthService } from '../../../core/services/auth.service';
import { UiMessages } from '../../../shared/messages/ui-messages';
import { ActivityRecord } from '../../../shared/models/activity.model';
import { ContentItem, ContentItemDraft } from '../../../shared/models/content-item.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-content',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit {
  contentItems: ContentItem[] = [];
  activeActivityRecordId: number | null = null;

  includedContentItems: number[] = [];

  showIncludeModalSignal = signal(false);
  newContentItemForm = signal<ContentItemDraft>({
    name: '',
    description: '',
    price: 0,
    isActive: true,
  });

  constructor(
    private contentService: ContentService,
    private activityService: ActivityService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadContentItems();

    this.route.queryParams.subscribe((params) => {
      if (params['includeActivityId']) {
        this.activeActivityRecordId = +params['includeActivityId'];
        this.loadIncludedContentItems(this.activeActivityRecordId);
      } else {
        this.activeActivityRecordId = null;
        this.includedContentItems = [];
      }
    });
  }

  get form(): ContentItemDraft {
    return this.newContentItemForm();
  }
  set form(value: ContentItemDraft) {
    this.newContentItemForm.set(value);
  }

  loadContentItems(): void {
    this.contentService.getContentItems().subscribe({
      next: (res) => (this.contentItems = res),
      error: (err) => console.error(err),
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
          error: (err) => console.error(err),
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
          error: (err) => console.error(err),
        });
    }
  }

  isIncluded(contentItem: ContentItem): boolean {
    return this.includedContentItems.includes(contentItem.id!);
  }

  private loadIncludedContentItems(activityRecordId: number): void {
    this.activityService.getActivityRecordById(activityRecordId).subscribe({
      next: (activityRecord) => {
        this.includedContentItems = activityRecord.items.map((item) => item.contentItemId);
      },
      error: (err) => console.error(err),
    });
  }

  openIncludeModal(): void {
    this.newContentItemForm.set({
      name: '',
      description: '',
      price: 0,
      isActive: true,
    });
    this.showIncludeModalSignal.set(true);
  }

  openEditModal(contentItem: ContentItem): void {
    this.newContentItemForm.set({ ...contentItem });
    this.showIncludeModalSignal.set(true);
  }

  closeIncludeModal(): void {
    this.showIncludeModalSignal.set(false);
    this.newContentItemForm.set({
      name: '',
      description: '',
      price: 0,
      isActive: true,
    });
  }

  saveContentItem(): void {
    const form = this.newContentItemForm();
    if (!form.name || form.price <= 0) {
      alert(UiMessages.content.invalidForm);
      return;
    }

    const patchData: Partial<ContentItemDraft> = {};
    if (form.name) patchData.name = form.name;
    if (form.description !== undefined)
      patchData.description = form.description;
    if (form.price) patchData.price = form.price;
    if (form.isActive !== undefined) patchData.isActive = form.isActive;

    if (form.id) {
      this.contentService.updateContentItem(form.id, patchData).subscribe({
        next: (updated) => {
          const index = this.contentItems.findIndex((item) => item.id === updated.id);
          if (index > -1) this.contentItems[index] = updated;
          alert(UiMessages.content.updated(updated.name));
          this.closeIncludeModal();
        },
        error: (err) => console.error(err),
      });
    } else {
      this.contentService.createContentItem(form).subscribe({
        next: (created) => {
          this.contentItems.push(created);
          alert(UiMessages.content.created(created.name));
          this.closeIncludeModal();
        },
        error: (err) => console.error(err),
      });
    }
  }

  deleteContentItem(contentItem: ContentItem): void {
    if (!confirm(UiMessages.content.deleteConfirm(contentItem.name))) return;

    this.contentService.deleteContentItem(contentItem.id!).subscribe({
      next: () => {
        this.contentItems = this.contentItems.filter((item) => item.id !== contentItem.id);
        alert(UiMessages.content.deleted(contentItem.name));
      },
      error: (err) => console.error(err),
    });
  }
}
