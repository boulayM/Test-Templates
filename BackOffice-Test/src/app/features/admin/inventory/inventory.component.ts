import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminInventoryService } from '../../../core/services/admin-inventory.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  data: Array<Record<string, unknown>> = [];
  page = 1;
  limit = 10;
  q = '';

  constructor(
    private service: AdminInventoryService,
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
      error: () => this.toast.show('Unable to load inventory'),
    });
  }

  private extractData(res: unknown): Array<Record<string, unknown>> {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    return Array.isArray(obj['data']) ? (obj['data'] as Array<Record<string, unknown>>) : [];
  }
}