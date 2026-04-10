import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CsrfService {
  private token: string | null = null;

  constructor(private api: ApiService) {}

  getToken(): string | null {
    return this.token;
  }

  clear(): void {
    this.token = null;
  }

  init(): Promise<void> {
    const cookieToken = this.readCookieToken();
    if (cookieToken) {
      this.token = cookieToken;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.api.get<{ csrfToken: string }>('/csrf', true).subscribe({
        next: (res) => {
          this.token = res?.csrfToken ?? null;
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  private readCookieToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(^| )csrfToken=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : null;
  }
}
