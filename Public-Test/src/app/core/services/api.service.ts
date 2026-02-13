import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = environment.apiUrl;

  constructor(private http: HttpClient) {
    if (environment.showSanityLogs) {
      console.log('API BASE URL =', this.BASE_URL);
    }
  }

  get<T>(path: string, noCache = false): Observable<T> {
    let url = `${this.BASE_URL}${path}`;
    if (noCache) {
      // Add a timestamp to bypass caches when needed.
      const sep = url.includes('?') ? '&' : '?';
      url += `${sep}_ts=${Date.now()}`;
    }
    return this.http.get<T>(url, { withCredentials: true });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.BASE_URL}${path}`, body, {
      withCredentials: true,
    });
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.BASE_URL}${path}`, body, {
      withCredentials: true,
    });
  }

  deleteRequest<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.BASE_URL}${path}`, {
      withCredentials: true,
    });
  }
}
