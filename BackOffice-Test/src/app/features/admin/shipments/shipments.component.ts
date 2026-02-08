import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminShipmentsService } from '../../../core/services/admin-shipments.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';
import { ValidationMessages } from '../../../shared/messages/validation-messages';
import { FormAlertState, mapBackendError } from '../../../shared/utils/backend-error-mapper';

@Component({
  selector: 'app-shipments',
  imports: [CommonModule, FormsModule, FormAlertComponent],
  templateUrl: './shipments.component.html',
  styleUrl: './shipments.component.scss',
})
export class ShipmentsComponent implements OnInit {
  data: ShipmentItem[] = [];
  total = 0;
  totalPages = 1;
  page = 1;
  limit = 10;
  q = '';
  loading = false;
  formAlert: FormAlertState | null = null;
  statusDraft: Record<number, string> = {};

  form = {
    orderId: '',
    carrier: '',
    trackingNumber: '',
    status: 'CREATED',
  };

  readonly statuses = ['CREATED', 'IN_TRANSIT', 'DELIVERED', 'LOST'];

  constructor(
    private service: AdminShipmentsService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.list({ page: this.page, limit: this.limit, q: this.q }).subscribe({
      next: (res: unknown) => {
        const list = this.extractData(res);
        this.data = list;
        this.total = this.extractTotal(res);
        this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
        this.statusDraft = {};
        for (const item of list) {
          this.statusDraft[item.id] = item.status;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Unable to load shipments');
      },
    });
  }

  createShipment(): void {
    const orderId = Number(this.form.orderId);
    if (!orderId) {
      this.formAlert = {
        title: 'Validation error',
        message: ValidationMessages.genericSubmit,
        items: ['Order id is required'],
      };
      return;
    }
    this.formAlert = null;
    this.service
      .create({
        orderId,
        carrier: this.form.carrier || null,
        trackingNumber: this.form.trackingNumber || null,
        status: this.form.status,
      })
      .subscribe({
        next: () => {
          this.toast.success('Shipment created');
          this.form = { orderId: '', carrier: '', trackingNumber: '', status: 'CREATED' };
          this.load();
        },
        error: (err: unknown) => {
          this.formAlert = mapBackendError(err, 'Unable to create shipment').alert;
        },
      });
  }

  updateStatus(item: ShipmentItem): void {
    const nextStatus = this.statusDraft[item.id];
    if (!nextStatus || nextStatus === item.status) return;
    this.service.update(item.id, { status: nextStatus }).subscribe({
      next: () => {
        this.toast.success('Shipment status updated');
        this.load();
      },
      error: () => this.toast.error('Unable to update shipment'),
    });
  }

  deleteShipment(item: ShipmentItem): void {
    if (!confirm('Delete this shipment?')) return;
    this.service.delete(item.id).subscribe({
      next: () => {
        this.toast.success('Shipment deleted');
        this.load();
      },
      error: () => this.toast.error('Unable to delete shipment'),
    });
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page -= 1;
    this.load();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page += 1;
    this.load();
  }

  private extractData(res: unknown): ShipmentItem[] {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    if (!Array.isArray(obj['data'])) return [];
    return (obj['data'] as unknown[])
      .filter((item) => !!item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: this.toNumber(row['id']),
          orderId: this.toNumber(row['orderId']),
          carrier: this.toNullableString(row['carrier']),
          trackingNumber: this.toNullableString(row['trackingNumber']),
          status: this.toString(row['status']),
        };
      })
      .filter((item) => item.id > 0);
  }

  private extractTotal(res: unknown): number {
    if (!res || typeof res !== 'object') return 0;
    const obj = res as Record<string, unknown>;
    return this.toNumber(obj['total']);
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' ? value : 0;
  }

  private toString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private toNullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }
}

interface ShipmentItem {
  id: number;
  orderId: number;
  carrier: string | null;
  trackingNumber: string | null;
  status: string;
}
