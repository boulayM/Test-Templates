import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { CouponService } from '../../../core/services/coupon.service';
import { UiMessages } from '../../../shared/messages/ui-messages';
import { ActivityRecord, ActivityItem } from '../../../shared/models/activity.model';
import { ToastService } from '../../../shared/services/toast.service';
import {
  computeCartSubtotalCents,
  computeCartSubtotalEuros,
} from '../../../shared/utils/cart-totals';

@Component({
    selector: 'app-activity',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './activity.component.html',
})
export class ActivityComponent implements OnInit {
  activityRecords: ActivityRecord[] = [];
  couponCode = '';
  couponValid = false;

  constructor(
    private activityService: ActivityService,
    private couponService: CouponService,
    private router: Router,
    public auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadActivityRecords();
  }

  loadActivityRecords(): void {
    this.activityService.getActivityRecords().subscribe({
      next: (res) => {
        this.activityRecords = res;
      },
      error: (err) => console.error(err),
    });
  }

  getTotal(activityRecord: ActivityRecord): number {
    return computeCartSubtotalEuros(activityRecord.items);
  }

  updateQuantity(activityRecord: ActivityRecord, item: ActivityItem): void {
    if (item.quantity < 1) item.quantity = 1;

    this.activityService
      .updateQuantity(activityRecord.id, item.contentItemId, item.quantity)
      .subscribe({
        next: () => {
          const targetActivityRecord = this.activityRecords.find((record) => record.id === activityRecord.id);
          if (targetActivityRecord) {
            const targetItem = targetActivityRecord.items.find(
              (recordItem) => recordItem.contentItemId === item.contentItemId,
            );
            if (targetItem) targetItem.quantity = item.quantity;
          }
        },
        error: (err) => console.error(err),
      });
  }

  removeItem(activityRecordId: number, contentItemId: number): void {
    if (!confirm(UiMessages.activity.removeItemConfirm)) return;
    this.activityService.removeContentItem(activityRecordId, contentItemId).subscribe({
      next: () => {
        const activityRecord = this.activityRecords.find((record) => record.id === activityRecordId);
        if (activityRecord) {
          activityRecord.items = activityRecord.items.filter(
            (recordItem) => recordItem.contentItemId !== contentItemId,
          );
        }
      },
      error: (err) => console.error(err),
    });
  }

  deleteActivityRecord(activityRecordId: number): void {
    if (!confirm(UiMessages.activity.deleteConfirm)) return;
    this.activityService.deleteActivityRecord(activityRecordId).subscribe({
      next: () => {
        this.activityRecords = this.activityRecords.filter(
          (record) => record.id !== activityRecordId,
        );
      },
      error: (err) => console.error(err),
    });
  }

  includeContentItem(activityRecordId: number): void {
    this.router.navigate(['/catalog'], {
      queryParams: { includeActivityId: activityRecordId },
    });
  }

  applyCoupon(activityRecord: ActivityRecord): void {
    const totalCents = computeCartSubtotalCents(activityRecord.items);
    this.couponService.validateCoupon(this.couponCode.trim(), totalCents).subscribe({
      next: (res) => {
        this.couponValid = res.valid;
        this.toast.show(res.valid ? 'Coupon valide.' : 'Coupon invalide.');
      },
      error: () => {
        this.couponValid = false;
        this.toast.show('Impossible de valider le coupon.');
      },
    });
  }

  goCheckout(): void {
    void this.router.navigate(['/checkout'], {
      queryParams: this.couponCode.trim() ? { couponCode: this.couponCode.trim() } : {},
    });
  }
}
