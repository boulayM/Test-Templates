import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../shared/services/toast.service';
import { FormAlertComponent } from '../../../shared/components/form-alert/form-alert.component';
import { ValidationMessages } from '../../../shared/messages/validation-messages';
import { FormAlertState, mapBackendError } from '../../../shared/utils/backend-error-mapper';

type UserRole = 'ADMIN' | 'USER' | 'LOGISTIQUE' | 'COMPTABILITE';

interface UserItem {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
}

interface UsersListResponse {
  data: UserItem[];
  total: number;
}

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, FormAlertComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: UserItem[] = [];
  total = 0;
  page = 1;
  limit = 10;
  totalPages = 1;

  q = '';
  roleFilter = '';
  activeFilter = '';
  verifiedFilter = '';

  // This API currently accepts USER/ADMIN only on users filters/create/update payloads.
  roles: UserRole[] = ['ADMIN', 'USER'];
  createAlert: FormAlertState | null = null;
  updateAlert: FormAlertState | null = null;
  createFieldErrors: Record<string, string> = {};
  updateFieldErrors: Record<string, string> = {};

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'USER',
    emailVerified: false
  };

  editing = false;
  edit: UserItem = { id: 0, firstName: '', lastName: '', email: '', role: 'USER', emailVerified: false, isActive: true };

  constructor(
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.clearCreateForm();
    this.load();
  }

  private clearCreateForm(): void {
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'USER',
      emailVerified: false
    };
    this.createAlert = null;
    this.createFieldErrors = {};
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  private buildFiltersParam(): string | undefined {
    const obj: Record<string, string> = {};
    if (this.roleFilter) obj['role'] = this.roleFilter;
    if (this.activeFilter !== '') obj['isActive'] = this.activeFilter;
    if (this.verifiedFilter !== '') obj['emailVerified'] = this.verifiedFilter;
    return Object.keys(obj).length > 0 ? JSON.stringify(obj) : undefined;
  }

  private unwrapBody(res: UsersListResponse | { body?: UsersListResponse } | unknown): UsersListResponse | unknown {
    if (res && typeof res === 'object' && 'body' in res) {
      const r = res as { body?: UsersListResponse };
      if (r.body) return r.body;
    }
    return res;
  }

  private extractList(res: UsersListResponse | unknown): UserItem[] {
    if (!res) return [];
    if (Array.isArray(res)) return res as UserItem[];
    if (res && typeof res === 'object' && 'data' in res) {
      const r = res as { data?: unknown; items?: unknown };
      if (Array.isArray(r.data)) return r.data as UserItem[];
      if (Array.isArray(r.items)) return r.items as UserItem[];
      if (r.data && typeof r.data === 'object' && 'data' in (r.data as object)) {
        const inner = r.data as { data?: unknown };
        if (Array.isArray(inner.data)) return inner.data as UserItem[];
      }
    }
    return [];
  }

  private extractTotal(res: UsersListResponse | unknown): number {
    if (!res) return 0;
    if (res && typeof res === 'object' && 'total' in res) {
      const r = res as { total?: unknown; data?: unknown };
      if (typeof r.total === 'number') return r.total;
      if (r.data && typeof r.data === 'object' && 'total' in (r.data as object)) {
        const inner = r.data as { total?: unknown };
        if (typeof inner.total === 'number') return inner.total;
      }
    }
    return 0;
  }

  private extractErrorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') return 'Operation failed';
    const e = err as { error?: { message?: string; details?: string | unknown[] }; message?: string };
    if (Array.isArray(e.error?.details) && e.error.details.length > 0) {
      const first = e.error.details[0] as { message?: string };
      if (first?.message) return first.message;
    }
    if (typeof e.error?.details === 'string') return e.error.details;
    return e.error?.message || e.message || 'Operation failed';
  }

  private isEmailValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isStrongPassword(value: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
  }

  private validateCreateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!this.form.firstName.trim()) errors['firstName'] = ValidationMessages.required;
    if (!this.form.lastName.trim()) errors['lastName'] = ValidationMessages.required;
    if (!this.form.email.trim()) {
      errors['email'] = ValidationMessages.required;
    } else if (!this.isEmailValid(this.form.email)) {
      errors['email'] = ValidationMessages.email;
    }
    if (!this.form.password) {
      errors['password'] = ValidationMessages.required;
    } else if (!this.isStrongPassword(this.form.password)) {
      errors['password'] = ValidationMessages.passwordPolicy;
    }

    this.createFieldErrors = errors;
    if (Object.keys(errors).length > 0) {
      this.createAlert = {
        title: 'Validation error',
        message: ValidationMessages.genericSubmit,
        items: Object.values(errors)
      };
      return false;
    }
    this.createAlert = null;
    return true;
  }

  private validateEditForm(): boolean {
    const errors: Record<string, string> = {};
    if (!this.edit.firstName.trim()) errors['editFirstName'] = ValidationMessages.required;
    if (!this.edit.lastName.trim()) errors['editLastName'] = ValidationMessages.required;
    if (!this.edit.email.trim()) {
      errors['editEmail'] = ValidationMessages.required;
    } else if (!this.isEmailValid(this.edit.email)) {
      errors['editEmail'] = ValidationMessages.email;
    }

    this.updateFieldErrors = errors;
    if (Object.keys(errors).length > 0) {
      this.updateAlert = {
        title: 'Validation error',
        message: ValidationMessages.genericSubmit,
        items: Object.values(errors)
      };
      return false;
    }
    this.updateAlert = null;
    return true;
  }

  load(): void {
    const filtersParam = this.buildFiltersParam();
    const params: Record<string, string | number | boolean | null | undefined> = {
      page: this.page,
      limit: this.limit,
      q: this.q,
      sort: 'createdAt',
      order: 'desc'
    };
    if (filtersParam) params['filters'] = filtersParam;

    this.usersService.list(params).subscribe({
      next: (res: UsersListResponse | { body?: UsersListResponse } | unknown) => {
        const body = this.unwrapBody(res);
        const list = this.extractList(body).filter((u) => u.role !== 'ADMIN');
        this.users = list;
        this.total = this.extractTotal(body);
        this.totalPages = Math.max(1, Math.ceil(this.total / this.limit));
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.toast.error(this.extractErrorMessage(err));
      }
    });
  }

  createUser(): void {
    if (!this.validateCreateForm()) return;
    this.createAlert = null;
    this.createFieldErrors = {};

    this.usersService.create(this.form).subscribe({
      next: () => {
        this.clearCreateForm();
        this.toast.success('User created');
        this.load();
      },
      error: (err: unknown) => {
        const mapped = mapBackendError(err, this.extractErrorMessage(err));
        this.createAlert = mapped.alert;
        this.createFieldErrors = mapped.fieldErrors;
      }
    });
  }

  editUser(user: UserItem): void {
    this.editing = true;
    this.edit = { ...user };
    this.updateAlert = null;
    this.updateFieldErrors = {};
  }

  cancelEdit(): void {
    this.editing = false;
    this.updateAlert = null;
    this.updateFieldErrors = {};
    this.edit = { id: 0, firstName: '', lastName: '', email: '', role: 'USER', emailVerified: false, isActive: true };
  }

  updateUser(): void {
    if (!this.edit.id) return;
    if (!this.validateEditForm()) return;
    this.updateAlert = null;
    this.updateFieldErrors = {};

    const payload: Record<string, unknown> = {
      firstName: this.edit.firstName,
      lastName: this.edit.lastName,
      email: this.edit.email,
      role: this.edit.role,
      emailVerified: this.edit.emailVerified,
      isActive: this.edit.isActive
    };

    this.usersService.update(this.edit.id, payload).subscribe({
      next: () => {
        this.editing = false;
        this.toast.success('User updated');
        this.edit = { id: 0, firstName: '', lastName: '', email: '', role: 'USER', emailVerified: false, isActive: true };
        this.load();
      },
      error: (err: unknown) => {
        const mapped = mapBackendError(err, this.extractErrorMessage(err));
        this.updateAlert = mapped.alert;
        this.updateFieldErrors = mapped.fieldErrors;
      }
    });
  }

  deleteUser(user: UserItem): void {
    if (!user?.id) return;
    if (!confirm('Delete this user?')) return;
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.toast.success('User deleted');
        this.load();
      },
      error: (err: unknown) => {
        this.toast.error(this.extractErrorMessage(err));
      }
    });
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page -= 1;
    this.load();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page += 1;
    this.load();
  }

  exportCsv(): void {
    this.usersService.exportCsv().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.toast.success('CSV exported');
      },
      error: (err: unknown) => {
        this.toast.error(this.extractErrorMessage(err));
      }
    });
  }
}
