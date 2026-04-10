import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { Order, PaymentSummary } from '../../../shared/models/order.model';

@Component({
  selector: 'app-payment',
  imports: [CommonModule, RouterModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);

  order: Order | null = null;
  payments: PaymentSummary[] = [];
  providerMessage = '';
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('orderId'));
    if (!orderId) {
      this.error = 'Commande introuvable.';
      this.loading = false;
      return;
    }

    this.orderService.getMyOrder(orderId).subscribe({
      next: (order) => (this.order = order),
      error: () => (this.error = 'Impossible de charger la commande.'),
    });

    this.paymentService.getPaymentsByOrder(orderId).subscribe({
      next: (payments) => {
        this.payments = payments;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les paiements.';
        this.loading = false;
      },
    });

    this.paymentService.getProviderStatus().subscribe({
      next: (status) => {
        this.providerMessage =
          'providerEnabled' in status
            ? `Fournisseurs actifs: ${status.providers.join(', ')}`
            : status.message;
      },
      error: () =>
        (this.providerMessage =
          'Les paiements ne sont pas disponibles dans cette demo.'),
    });
  }
}
