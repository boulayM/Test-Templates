import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { OrderRecord, Shipment } from '../../../shared/models/order.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  loading = true;
  order: OrderRecord | null = null;
  shipments: Shipment[] = [];

  constructor(
    private route: ActivatedRoute,
    private ordersService: OrderService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(id)) {
      this.loading = false;
      this.toast.show('Commande introuvable.');
      return;
    }
    forkJoin({
      order: this.ordersService.getMyOrder(id),
      shipments: this.ordersService.getOrderShipments(id),
    }).subscribe({
      next: ({ order, shipments }) => {
        this.order = order;
        this.shipments = shipments;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Impossible de charger la commande.');
      },
    });
  }
}
