import { Injectable, signal } from '@angular/core';

type ToastType = 'info' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class ToastService {
  message = signal<string>('');
  visible = signal(false);
  type = signal<ToastType>('info');
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: ToastType = 'info', durationMs = 4000): void {
    this.message.set(message);
    this.type.set(type);
    this.visible.set(true);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => this.visible.set(false), durationMs);
  }

  success(message: string, durationMs = 4000): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 5000): void {
    this.show(message, 'error', durationMs);
  }

  hide(): void {
    this.visible.set(false);
  }
}