import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from '../../../app/features/auth/login/login.component';
import { AuthService } from '../../../app/core/services/auth.service';
import { AuthMessages } from '../../../app/shared/messages/auth-messages';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let router: { navigate: jasmine.Spy };
  let auth: {
    login: jasmine.Spy;
    initCsrfAfterLogin: jasmine.Spy;
    logout: jasmine.Spy;
  };
  let cdr: { detectChanges: jasmine.Spy };

  beforeEach(() => {
    router = { navigate: jasmine.createSpy('navigate') };
    auth = {
      login: jasmine.createSpy('login'),
      initCsrfAfterLogin: jasmine.createSpy('initCsrfAfterLogin').and.resolveTo(undefined),
      logout: jasmine.createSpy('logout').and.resolveTo(undefined),
    };
    cdr = { detectChanges: jasmine.createSpy('detectChanges') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ChangeDetectorRef, useValue: cdr },
      ],
    });

    component = new LoginComponent(
      TestBed.inject(AuthService),
      TestBed.inject(Router),
      TestBed.inject(ChangeDetectorRef),
    );
  });

  it('navigates to dashboard for admin', async () => {
    auth.login.and.returnValue(of({ user: { role: 'ADMIN' } }));
    await (component as any).processLoginResult({ user: { role: 'ADMIN' } });
    expect(auth.initCsrfAfterLogin).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('rejects non admin', async () => {
    auth.login.and.returnValue(of({ user: { role: 'USER' } }));
    await (component as any).processLoginResult({ user: { role: 'USER' } });
    expect(auth.logout).toHaveBeenCalled();
    expect(component.error).toBe(AuthMessages.adminOnly);
  });
});
