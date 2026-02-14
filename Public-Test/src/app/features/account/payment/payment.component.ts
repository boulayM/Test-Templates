import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { ServiceUnavailableComponent } from '../../../shared/components/service-unavailable/service-unavailable.component';
import { Payment } from '../../../shared/models/order.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-payment',
  imports: [CommonModule, FormsModule, ServiceUnavailableComponent],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
  orderId = 0;
  loading = true;
  creating = false;
  providerUnavailable = false;
  payments: Payment[] = [];
  provider: 'MANUAL' | 'STRIPE' | 'PAYPAL' = 'MANUAL';

  constructor(
    private route: ActivatedRoute,
    private paymentsService: PaymentService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.paymentsService.getProviderStatus().subscribe({
      next: () => {
        this.refreshPayments();
      },
      error: () => {
        this.providerUnavailable = true;
        this.loading = false;
      },
    });
  }

  refreshPayments(): void {
    this.paymentsService.getOrderPayments(this.orderId).subscribe({
      next: (items) => {
        this.payments = items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Impossible de charger les paiements.');
      },
    });
  }

  createPayment(): void {
    this.creating = true;
    this.paymentsService
      .createPayment({
        orderId: this.orderId,
        provider: this.provider,
      })
      .subscribe({
        next: () => {
          this.creating = false;
          this.toast.show('Paiement cree.');
          this.refreshPayments();
        },
        error: (err) => {
          this.creating = false;
          const message = err?.error?.message || 'Impossible de creer le paiement.';
          this.toast.show(message);
        },
      });
  }
}
