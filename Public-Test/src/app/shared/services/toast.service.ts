import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  message = signal<string>('');
  visible = signal(false);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  show(message: string, durationMs = 2000): void {
    this.message.set(message);
    this.visible.set(true);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => this.visible.set(false), durationMs);
  }

  hide(): void {
    this.visible.set(false);
  }
}
