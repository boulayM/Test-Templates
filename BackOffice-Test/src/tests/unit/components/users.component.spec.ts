import { of, throwError } from 'rxjs';
import { UsersComponent } from '../../../app/features/admin/users/users.component';
import { ValidationMessages } from '../../../app/shared/messages/validation-messages';

describe('UsersComponent', () => {
  type UsersServiceSpy = jasmine.SpyObj<{
    list: (params?: Record<string, unknown>) => unknown;
    create: (body: Record<string, unknown>) => unknown;
    update: (id: number, body: Record<string, unknown>) => unknown;
    delete: (id: number) => unknown;
    exportCsv: () => unknown;
  }>;

  let usersService: UsersServiceSpy;
  let cdr: { detectChanges: jasmine.Spy };
  let toast: { success: jasmine.Spy; error: jasmine.Spy };
  let component: UsersComponent;

  function createValidForm() {
    component.form = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Strong1!',
      role: 'USER',
      emailVerified: false,
    };
  }

  beforeEach(() => {
    usersService = jasmine.createSpyObj('UsersService', ['list', 'create', 'update', 'delete', 'exportCsv']);
    cdr = { detectChanges: jasmine.createSpy('detectChanges') };
    toast = { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') };

    usersService.list.and.returnValue(of({ data: [], total: 0 }));
    component = new UsersComponent(usersService as never, cdr as never, toast as never);
  });

  it('blocks create when required fields are missing', () => {
    component.form = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'USER',
      emailVerified: false,
    };

    component.createUser();

    expect(usersService.create).not.toHaveBeenCalled();
    expect(component.createAlert?.message).toBe(ValidationMessages.genericSubmit);
    expect(component.createFieldErrors['firstName']).toBe(ValidationMessages.required);
    expect(component.createFieldErrors['lastName']).toBe(ValidationMessages.required);
    expect(component.createFieldErrors['email']).toBe(ValidationMessages.required);
    expect(component.createFieldErrors['password']).toBe(ValidationMessages.required);
  });

  it('blocks create when email/password format is invalid', () => {
    component.form = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'bad-email',
      password: 'weak',
      role: 'USER',
      emailVerified: false,
    };

    component.createUser();

    expect(usersService.create).not.toHaveBeenCalled();
    expect(component.createFieldErrors['email']).toBe(ValidationMessages.email);
    expect(component.createFieldErrors['password']).toBe(ValidationMessages.passwordPolicy);
  });

  it('maps backend field errors on create', () => {
    createValidForm();
    usersService.create.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Validation failed',
          details: [{ path: ['email'], message: 'Invalid email' }],
        },
      })),
    );

    component.createUser();

    expect(component.createFieldErrors['email']).toBe('Invalid email');
    expect(component.createAlert?.items).toContain('Invalid email');
  });

  it('creates user successfully and reloads list', () => {
    createValidForm();
    usersService.create.and.returnValue(of({}));
    spyOn(component as UsersComponent, 'load');

    component.createUser();

    expect(toast.success).toHaveBeenCalledWith('User created');
    expect(component.load).toHaveBeenCalled();
    expect(component.form.email).toBe('');
    expect(component.form.password).toBe('');
  });

  it('blocks update when edit form is invalid', () => {
    component.edit = {
      id: 10,
      firstName: '',
      lastName: '',
      email: 'bad-email',
      role: 'USER',
      emailVerified: false,
      isActive: true,
    };

    component.updateUser();

    expect(usersService.update).not.toHaveBeenCalled();
    expect(component.updateAlert?.message).toBe(ValidationMessages.genericSubmit);
    expect(component.updateFieldErrors['editFirstName']).toBe(ValidationMessages.required);
    expect(component.updateFieldErrors['editLastName']).toBe(ValidationMessages.required);
    expect(component.updateFieldErrors['editEmail']).toBe(ValidationMessages.email);
  });

  it('maps conflict backend error on update', () => {
    component.edit = {
      id: 11,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      role: 'USER',
      emailVerified: false,
      isActive: true,
    };
    usersService.update.and.returnValue(throwError(() => ({ status: 409, error: { code: 'CONFLICT' } })));

    component.updateUser();

    expect(component.updateAlert?.message).toContain('already used');
  });
});
