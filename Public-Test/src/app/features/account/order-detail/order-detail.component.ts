import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import {
  Order,
  PaymentSummary,
  ShipmentSummary,
} from '../../../shared/models/order.model';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);

  order: Order | null = null;
  shipments: ShipmentSummary[] = [];
  payments: PaymentSummary[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (!orderId) {
      this.error = 'Commande introuvable.';
      this.loading = false;
      return;
    }

    this.orderService.getMyOrder(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger cette commande.';
        this.loading = false;
      },
    });

    this.orderService.getMyOrderShipments(orderId).subscribe({
      next: (shipments) => (this.shipments = shipments),
      error: () => undefined,
    });

    this.paymentService.getPaymentsByOrder(orderId).subscribe({
      next: (payments) => (this.payments = payments),
      error: () => undefined,
    });
  }
}
