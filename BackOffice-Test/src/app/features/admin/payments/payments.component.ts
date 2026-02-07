import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminPaymentsService } from '../../../core/services/admin-payments.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent implements OnInit {
  data: Array<Record<string, unknown>> = [];
  page = 1;
  limit = 10;
  q = '';

  constructor(
    private service: AdminPaymentsService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.list({ page: this.page, limit: this.limit, q: this.q }).subscribe({
      next: (res: unknown) => {
        this.data = this.extractData(res);
        this.cdr.detectChanges();
      },
      error: () => this.toast.show('Unable to load payments'),
    });
  }

  private extractData(res: unknown): Array<Record<string, unknown>> {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    return Array.isArray(obj['data']) ? (obj['data'] as Array<Record<string, unknown>>) : [];
  }
}