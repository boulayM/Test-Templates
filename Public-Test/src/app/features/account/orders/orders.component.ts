import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderRecord } from '../../../shared/models/order.model';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  loading = true;
  orders: OrderRecord[] = [];

  constructor(
    private ordersService: OrderService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.ordersService.listMyOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Impossible de charger les commandes.');
      },
    });
  }
}
