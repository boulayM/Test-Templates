import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from './api.service';
import { User } from '../../shared/models/user.model';
import { ModalCleanupService } from './modal-cleanup.service';
import { CsrfService } from './csrf.service';
import { AuthMessages } from '../../shared/messages/auth-messages';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private userLoadedSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  userLoaded$ = this.userLoadedSubject.asObservable();
  private lastLoginError: string | null = null;
  private lastLoginErrorMessage: string | null = null;
  private lastLoginLimitTotal: number | null = null;
  private lastLoginLimitRemaining: number | null = null;

  getLastLoginError(): string | null {
    return this.lastLoginError;
  }

  getLastLoginErrorMessage(): string | null {
    return this.lastLoginErrorMessage;
  }

  getLastLoginLimit(): { total: number | null; remaining: number | null } {
    return {
      total: this.lastLoginLimitTotal,
      remaining: this.lastLoginLimitRemaining,
    };
  }

  clearLoginError(): void {
    this.lastLoginError = null;
    this.lastLoginErrorMessage = null;
    this.lastLoginLimitTotal = null;
    this.lastLoginLimitRemaining = null;
  }

  constructor(
    private api: ApiService,
    private router: Router,
    private modalCleanup: ModalCleanupService,
    private csrf: CsrfService,
  ) {}

  /** LOGIN */
  login(credentials: {
    email: string;
    password: string;
  }): Observable<User | null> {
    this.userLoadedSubject.next(false);
    this.clearLoginError();

    return this.api.post('/auth/login', credentials).pipe(
      switchMap(() => this.api.get<{ user: User }>('/users/me')),
      map((res) => res.user),
      switchMap((user) => {
        if (user?.role && user.role !== 'USER') {
          this.currentUserSubject.next(null);
          this.userLoadedSubject.next(true);
          this.lastLoginError = 'ROLE_NOT_ALLOWED';
          this.lastLoginErrorMessage = AuthMessages.userOnly;
          this.logout();
          return of(null);
        }
        return of(user);
      }),
      tap((user) => {
        if (!user) {
          return;
        }
        this.currentUserSubject.next(user);
        this.userLoadedSubject.next(true);
        void this.csrf.init();
        this.modalCleanup.closeModalById('loginModal');
        // Navigation vers dashboard
        this.router.navigate(['/dashboard']).then(() => {
          this.modalCleanup.closeAll();
        });
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('[Auth] login failed', err);
        this.currentUserSubject.next(null);
        this.userLoadedSubject.next(true);
        this.lastLoginError = 'INVALID_CREDENTIALS';
        const payload = err?.error;
        let message: string = AuthMessages.loginInvalid;
        if (typeof payload === 'string') {
          message = payload;
        } else if (payload?.message) {
          message = payload.message;
        } else if (
          Array.isArray(payload?.errors) &&
          payload.errors.length > 0
        ) {
          message = payload.errors[0]?.msg || message;
        }
        this.lastLoginErrorMessage = message;
        const limitHeader = err?.headers?.get('RateLimit-Limit');
        const remainingHeader = err?.headers?.get('RateLimit-Remaining');
        this.lastLoginLimitTotal = limitHeader
          ? Number(limitHeader)
          : (payload?.limitTotal ?? null);
        this.lastLoginLimitRemaining = remainingHeader
          ? Number(remainingHeader)
          : (payload?.remaining ?? null);
        return of(null);
      }),
    );
  }

  /** INIT AUTH (appelé au bootstrap Angular) */
  initAuth(): Promise<void> {
    return new Promise((resolve) => {
      this.userLoadedSubject.next(false);

      this.api
        .get<{ user: User }>('/users/me')
        .pipe(
          map((res) => res.user),
          catchError(() => of(null)),
        )
        .subscribe((user) => {
          this.currentUserSubject.next(user);
          this.userLoadedSubject.next(true);
          resolve();
        });
    });
  }

  logout(): void {
    this.modalCleanup.closeModalById('loginModal');
    this.currentUserSubject.next(null);
    this.userLoadedSubject.next(true);
    this.router.navigate(['/home']);

    this.api.post('/auth/logout', {}).subscribe({
      next: () => this.csrf.clear(),
      error: (err) => {
        console.error('[Auth] logout failed', err);
      },
    });
  }

  register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    captchaToken?: string;
  }): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/auth/register', payload);
  }

  /** Helpers synchrones */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'ADMIN';
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getLoginDate(): Date {
    const date = localStorage.getItem('loginDate');
    return date ? new Date(date) : new Date();
  }
}
