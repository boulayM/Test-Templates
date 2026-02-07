import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../shared/services/toast.service';

type UserRole = 'ADMIN' | 'USER';

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
  imports: [CommonModule, FormsModule],
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

  roles = ['ADMIN', 'USER'];

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
    const e = err as { error?: { message?: string; details?: string }; message?: string };
    return e.error?.message || e.error?.details || e.message || 'Operation failed';
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
        this.toast.show(this.extractErrorMessage(err));
      }
    });
  }

  createUser(): void {
    this.usersService.create(this.form).subscribe({
      next: () => {
        this.clearCreateForm();
        this.load();
      },
      error: (err: unknown) => {
        this.toast.show(this.extractErrorMessage(err));
      }
    });
  }

  editUser(user: UserItem): void {
    this.editing = true;
    this.edit = { ...user };
  }

  cancelEdit(): void {
    this.editing = false;
    this.edit = { id: 0, firstName: '', lastName: '', email: '', role: 'USER', emailVerified: false, isActive: true };
  }

  updateUser(): void {
    if (!this.edit.id) return;

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
        this.edit = { id: 0, firstName: '', lastName: '', email: '', role: 'USER', emailVerified: false, isActive: true };
        this.load();
      },
      error: (err: unknown) => {
        this.toast.show(this.extractErrorMessage(err));
      }
    });
  }

  deleteUser(user: UserItem): void {
    if (!user?.id) return;
    if (!confirm('Delete this user?')) return;
    this.usersService.delete(user.id).subscribe({
      next: () => this.load(),
      error: (err: unknown) => {
        this.toast.show(this.extractErrorMessage(err));
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
      },
      error: (err: unknown) => {
        this.toast.show(this.extractErrorMessage(err));
      }
    });
  }
}