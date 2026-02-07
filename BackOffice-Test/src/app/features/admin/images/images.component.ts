import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminImagesService } from '../../../core/services/admin-images.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-images',
  imports: [CommonModule, FormsModule],
  templateUrl: './images.component.html',
  styleUrl: './images.component.scss',
})
export class ImagesComponent implements OnInit {
  data: Array<Record<string, unknown>> = [];
  page = 1;
  limit = 10;
  q = '';
  productId = '';

  constructor(
    private service: AdminImagesService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.list({ page: this.page, limit: this.limit, productId: this.productId || undefined }).subscribe({
      next: (res: unknown) => {
        this.data = this.extractData(res);
        this.cdr.detectChanges();
      },
      error: () => this.toast.show('Unable to load images'),
    });
  }

  private extractData(res: unknown): Array<Record<string, unknown>> {
    if (!res || typeof res !== 'object') return [];
    const obj = res as Record<string, unknown>;
    return Array.isArray(obj['data']) ? (obj['data'] as Array<Record<string, unknown>>) : [];
  }
}