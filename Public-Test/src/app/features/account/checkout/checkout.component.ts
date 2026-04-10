import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ActivityService } from '../../../core/services/activity.service';
import { AddressService } from '../../../core/services/address.service';
import { OrderService } from '../../../core/services/order.service';
import { Address } from '../../../shared/models/address.model';
import { Cart } from '../../../shared/models/cart.model';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  private activityService = inject(ActivityService);
  private addressService = inject(AddressService);
  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  cart: Cart | null = null;
  addresses: Address[] = [];
  shippingAddressId: number | null = null;
  billingAddressId: number | null = null;
  couponCode = '';
  loading = true;
  submitting = false;
  error: string | null = null;

  ngOnInit(): void {
    this.couponCode = this.route.snapshot.queryParamMap.get('coupon') || '';

    this.activityService.getCart().subscribe({
      next: (cart) => (this.cart = cart),
      error: () => (this.error = 'Impossible de charger le panier.'),
    });

    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        const defaultAddress =
          addresses.find((address) => address.isDefault) || addresses[0];
        this.shippingAddressId = defaultAddress?.id || null;
        this.billingAddressId = defaultAddress?.id || null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les adresses.';
        this.loading = false;
      },
    });
  }

  get totalCents(): number {
    return (this.cart?.items || []).reduce(
      (sum, item) => sum + item.quantity * item.unitPriceCents,
      0,
    );
  }

  submitOrder(): void {
    if (!this.shippingAddressId || !this.billingAddressId) {
      this.error = 'Selectionnez les adresses de livraison et de facturation.';
      return;
    }

    this.submitting = true;
    this.error = null;
    this.orderService
      .createOrder({
        shippingAddressId: this.shippingAddressId,
        billingAddressId: this.billingAddressId,
        couponCode: this.couponCode || undefined,
      })
      .subscribe({
        next: (order) => {
          this.submitting = false;
          this.router.navigate(['/payment', order.id]);
        },
        error: (error) => {
          this.submitting = false;
          this.error =
            error?.error?.message || 'La commande n a pas pu etre creee.';
        },
      });
  }
}
