import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { ApiService } from '../../app/core/services/api.service';
import { ModalCleanupService } from '../../app/core/services/modal-cleanup.service';
import { CsrfService } from '../../app/core/services/csrf.service';
import { User } from '../../app/shared/models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let api: jasmine.SpyObj<ApiService>;
  let router: jasmine.SpyObj<Router>;
  let modal: jasmine.SpyObj<ModalCleanupService>;
  let csrf: jasmine.SpyObj<CsrfService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', ['get', 'post']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    modal = jasmine.createSpyObj('ModalCleanupService', [
      'closeModalById',
      'closeAll',
    ]);
    csrf = jasmine.createSpyObj('CsrfService', ['init', 'clear']);

    router.navigate.and.returnValue(Promise.resolve(true));
    csrf.init.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ModalCleanupService, useValue: modal },
        { provide: CsrfService, useValue: csrf },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should initAuth set user when /users/me succeeds', async () => {
    const user = { id: 1, role: 'ADMIN' } as User;
    api.get.and.returnValue(of({ user }));

    await service.initAuth();

    expect(service.getCurrentUser()).toEqual(user);
  });

  it('should initAuth set null when /users/me fails', async () => {
    api.get.and.returnValue(throwError(() => new Error('fail')));

    await service.initAuth();

    expect(service.getCurrentUser()).toBeNull();
  });

  it('should login, set user, and navigate', (done) => {
    const user = { id: 1, role: 'USER' } as User;
    api.post.and.returnValue(of({}));
    api.get.and.returnValue(of({ user }));

    service.login({ email: 'a@b.com', password: 'x' }).subscribe((result) => {
      expect(result).toEqual(user);
      expect(modal.closeModalById).toHaveBeenCalledWith('loginModal');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });

  it('should logout and clear state', () => {
    api.post.and.returnValue(of({}));

    service.logout();

    expect(api.post).toHaveBeenCalledWith('/auth/logout', {});
    expect(csrf.clear).toHaveBeenCalled();
    expect(service.getCurrentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should return null when register fails', (done) => {
    api.post.and.returnValue(throwError(() => new Error('fail')));

    service
      .register({
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: 'x',
      })
      .subscribe({
        next: () => done.fail('expected register to fail'),
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        },
      });
  });
});
