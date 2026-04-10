import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ActivityService } from '../../../core/services/activity.service';
import { Cart, CartItem } from '../../../shared/models/cart.model';

@Component({
  selector: 'app-activity',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
})
export class ActivityComponent implements OnInit {
  private activityService = inject(ActivityService);
  private router = inject(Router);

  cart: Cart | null = null;
  couponCode = '';
  couponMessage: string | null = null;
  couponDiscountCents = 0;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadActivityRecords();
  }

  loadActivityRecords(): void {
    this.activityService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le panier.';
        this.loading = false;
      },
    });
  }

  get subtotalCents(): number {
    return (this.cart?.items || []).reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0,
    );
  }

  get totalCents(): number {
    return Math.max(this.subtotalCents - this.couponDiscountCents, 0);
  }

  updateQuantity(item: CartItem): void {
    if (item.quantity < 1) item.quantity = 1;

    this.activityService.updateQuantity(item.id, item.quantity).subscribe({
      next: () => undefined,
      error: () => (this.error = 'La quantite n a pas pu etre mise a jour.'),
    });
  }

  removeItem(itemId: number): void {
    this.activityService.removeItem(itemId).subscribe({
      next: () => {
        if (this.cart) {
          this.cart = {
            ...this.cart,
            items: this.cart.items.filter((item) => item.id !== itemId),
          };
        }
      },
      error: () =>
        (this.error = 'Impossible de retirer cet article du panier.'),
    });
  }

  applyCoupon(): void {
    const code = this.couponCode.trim();
    if (!code) {
      this.couponMessage = 'Saisissez un code coupon avant validation.';
      this.couponDiscountCents = 0;
      return;
    }

    this.activityService.validateCoupon(code, this.subtotalCents).subscribe({
      next: (result) => {
        if (!result.valid) {
          this.couponDiscountCents = 0;
          this.couponMessage = `Coupon invalide ou indisponible (${result.reason || 'erreur'}).`;
          return;
        }
        this.couponDiscountCents = result.discountCents || 0;
        this.couponMessage = `Coupon ${result.coupon?.code} applique.`;
      },
      error: () => {
        this.couponDiscountCents = 0;
        this.couponMessage = 'Impossible de verifier ce coupon.';
      },
    });
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout'], {
      queryParams: this.couponCode.trim()
        ? { coupon: this.couponCode.trim() }
        : undefined,
    });
  }
}
