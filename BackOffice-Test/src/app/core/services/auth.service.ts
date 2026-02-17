import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap, timeout } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { CsrfService } from './csrf.service';
import { AuthMessages } from '../../shared/messages/auth-messages';
import { HttpErrorResponse } from '@angular/common/http';

export interface UserDto {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResult {
  user: UserDto | null;
  error?: string;
  limitTotal?: number;
  remaining?: number;
  status?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  private userLoadedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  userLoaded$ = this.userLoadedSubject.asObservable();

  constructor(
    private api: ApiService,
    private router: Router,
    private csrf: CsrfService,
  ) {}

  initAuth(): void {
    this.userLoadedSubject.next(false);
    this.api
      .get<{ user: UserDto }>('/users/me')
      .pipe(
        timeout(5000),
        map((res: { user: UserDto }) => res.user || null),
        catchError(() => of(null)),
      )
      .subscribe((user: UserDto | null) => {
        this.currentUserSubject.next(user);
        this.userLoadedSubject.next(true);
      });
  }

  login(email: string, password: string): Observable<LoginResult> {
    this.userLoadedSubject.next(false);
    return this.api.post<unknown>('/auth/login', { email, password }).pipe(
      switchMap(() => this.api.get<{ user: UserDto }>('/users/me')),
      map((res: { user: UserDto }) => res.user || null),
      tap((user: UserDto | null) => {
        this.currentUserSubject.next(user);
        this.userLoadedSubject.next(true);
      }),
      map((user: UserDto | null) => ({ user })),
      catchError((err: HttpErrorResponse) => {
        this.currentUserSubject.next(null);
        this.userLoadedSubject.next(true);
        const payload = err && err.error ? err.error : null;
        let message: string = AuthMessages.loginInvalid;
        if (typeof payload === 'string') {
          message = payload;
        } else if (payload?.message) {
          message = payload.message;
        } else if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
          message = payload.errors[0]?.msg || message;
        }
        const limitHeader = err?.headers?.get('RateLimit-Limit');
        const remainingHeader = err?.headers?.get('RateLimit-Remaining');
        const limitTotal = limitHeader ? Number(limitHeader) : payload?.limitTotal;
        const remaining = remainingHeader ? Number(remainingHeader) : payload?.remaining;
        return of({
          user: null,
          error: message,
          limitTotal,
          remaining,
          status: err?.status,
        });
      }),
    );
  }

  async initCsrfAfterLogin(): Promise<void> {
    try {
      await this.csrf.initCsrf().toPromise();
    } catch {}
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout', {}).toPromise();
    } catch {}
    this.csrf.clearCsrf();
    this.currentUserSubject.next(null);
    this.userLoadedSubject.next(true);
    this.router.navigate(['/login']);
  }

  get user(): UserDto | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  get userLoaded(): boolean {
    return this.userLoadedSubject.value;
  }

  get isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'ADMIN';
  }
}
