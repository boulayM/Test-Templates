import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AddressService } from '../../../core/services/address.service';
import { ActivityService } from '../../../core/services/activity.service';
import { CouponService } from '../../../core/services/coupon.service';
import { OrderService } from '../../../core/services/order.service';
import { Address } from '../../../shared/models/address.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  addresses: Address[] = [];
  shippingAddressId?: number;
  billingAddressId?: number;
  couponCode = '';
  couponApplied = false;
  subtotalCents = 0;
  shippingCents = 0;
  discountCents = 0;
  submitting = false;

  constructor(
    private addressesService: AddressService,
    private activityService: ActivityService,
    private couponService: CouponService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.couponCode = this.route.snapshot.queryParamMap.get('couponCode') || '';
    this.addressesService.getMyAddresses().subscribe({
      next: (data) => {
        this.addresses = data;
        const defaultAddress = data.find((a) => a.isDefault);
        if (defaultAddress) {
          this.shippingAddressId = defaultAddress.id;
          this.billingAddressId = defaultAddress.id;
        }
      },
      error: () => this.toast.show('Impossible de charger les adresses.'),
    });
    this.activityService.getActivityRecords().subscribe({
      next: (records) => {
        const cart = records[0];
        this.subtotalCents = cart
          ? Math.round(
              cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0) * 100,
            )
          : 0;
      },
      error: () => this.toast.show('Impossible de charger le panier.'),
    });
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponApplied = false;
      this.discountCents = 0;
      return;
    }
    this.couponService
      .validateCoupon(this.couponCode.trim(), this.subtotalCents)
      .subscribe({
        next: (res) => {
          this.couponApplied = res.valid;
          this.discountCents = res.valid ? Number(res.discountCents || 0) : 0;
          if (!res.valid) {
            this.toast.show('Coupon invalide.');
          } else {
            this.toast.show('Coupon applique.');
          }
        },
        error: () => {
          this.couponApplied = false;
          this.discountCents = 0;
          this.toast.show('Impossible de valider le coupon.');
        },
      });
  }

  submitOrder(): void {
    if (!this.shippingAddressId || !this.billingAddressId) {
      this.toast.show('Selectionnez les adresses de livraison et facturation.');
      return;
    }
    this.submitting = true;
    this.orderService
      .createOrder({
        shippingAddressId: this.shippingAddressId,
        billingAddressId: this.billingAddressId,
        couponCode: this.couponCode.trim() || undefined,
      })
      .subscribe({
        next: (order) => {
          this.submitting = false;
          this.toast.show('Commande creee.');
          void this.router.navigate(['/account/orders', order.id]);
        },
        error: () => {
          this.submitting = false;
          this.toast.show('Impossible de creer la commande.');
        },
      });
  }

  get totalCents(): number {
    return Math.max(this.subtotalCents + this.shippingCents - this.discountCents, 0);
  }
}
