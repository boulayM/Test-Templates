import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CsrfService {
  private token: string | null = null;

  constructor(private api: ApiService) {}

  getToken(): string | null {
    if (!this.token && typeof document !== 'undefined') {
      const match = document.cookie.match(/(^|;\s*)csrfToken=([^;]+)/);
      if (match && match[2]) {
        this.token = decodeURIComponent(match[2]);
      }
    }
    return this.token;
  }

  initCsrf() {
    return this.api.get<{ csrfToken?: string; token?: string }>('/csrf', undefined, true).pipe(
      map((res: { csrfToken?: string; token?: string }) => {
        this.token = res.csrfToken || res.token || null;
        return this.token;
      }),
    );
  }

  clearCsrf(): void {
    this.token = null;
  }
}
