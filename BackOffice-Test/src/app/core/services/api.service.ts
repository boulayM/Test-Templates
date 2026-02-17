import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl =
    (window as Window & { __env?: { API_URL?: string } }).__env?.API_URL ||
    'https://mabdev.alwaysdata.net/api-postgres';

  constructor(private http: HttpClient) {}

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    noCache = false,
  ): string {
    const url = new URL(this.baseUrl + path);
    if (params) {
      for (const key of Object.keys(params)) {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }
    if (noCache) {
      url.searchParams.set('_ts', String(Date.now()));
    }
    return url.toString();
  }

  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    noCache = false,
  ): Observable<T> {
    const url = this.buildUrl(path, params, noCache);
    return this.http.get<T>(url, { withCredentials: true });
  }

  getBlob(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    noCache = false,
  ): Observable<Blob> {
    const url = this.buildUrl(path, params, noCache);
    return this.http.get(url, { withCredentials: true, responseType: 'blob' });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.baseUrl + path, body, { withCredentials: true });
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.baseUrl + path, body, { withCredentials: true });
  }

  deleteRequest<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.baseUrl + path, { withCredentials: true });
  }
}
