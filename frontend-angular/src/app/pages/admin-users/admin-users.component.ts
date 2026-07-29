import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { finalize } from 'rxjs';

import { USER_ROLES, UserRole } from '../../core/models/auth.model';
import {
  AdminUser,
  AdminUsersApiService,
  AdminUserSort,
  AdminUserStatus,
} from '../../core/services/admin-users-api.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { LanguageService } from '../../core/services/language.service';
import { buildPaginationItems } from '../../shared/utils/pagination';

interface AdminUserView extends AdminUser {
  user_name: string;
  full_name: string | null;
  role_id: number;
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(AdminUsersApiService);
  private readonly apiErrors = inject(ApiErrorService);
  protected readonly language = inject(LanguageService);

  protected readonly users = signal<AdminUserView[]>([]);
  protected readonly visible = computed(() => this.users());
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly search = signal('');
  protected readonly role = signal(0);
  protected readonly active = signal('');
  protected readonly sort = signal<AdminUserSort>('newest');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(5);
  protected readonly pageInput = signal(1);
  protected readonly sizeInput = signal(5);

  protected readonly addOpen = signal(false);
  protected readonly editOpen = signal(false);
  protected readonly editUser = signal<AdminUserView | null>(null);
  protected readonly editFullName = signal('');
  protected readonly editUserName = signal('');
  protected readonly editEmail = signal('');
  protected readonly editPhone = signal('');
  protected readonly confirmUser = signal<AdminUserView | null>(null);
  protected readonly confirmKind = signal<'status' | 'role' | null>(null);
  protected readonly pendingRole = signal(2);
  protected readonly showPassword = signal(false);
  protected readonly fullName = signal('');
  protected readonly userName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly newRole = signal(2);

  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly paginationItems = computed(() =>
    buildPaginationItems(this.page(), this.totalPages()),
  );
  protected readonly summary = computed(() => {
    const total = this.total();
    const from = total ? (this.page() - 1) * this.pageSize() + 1 : 0;
    const to = Math.min(this.page() * this.pageSize(), total);
    return this.language.translate('pagination.summary',{from,to,total});
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  protected initials(user: AdminUserView): string {
    return (user.fullName || user.userName)
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  protected roleName(role: UserRole): string {
    if (role === USER_ROLES.SUPER_ADMIN) {
      return this.language.choose('Quản trị viên cấp cao', 'Super Admin');
    }
    if (role === USER_ROLES.BLOG_OWNER) {
      return this.language.choose('Chủ blog', 'Blog Owner');
    }
    return this.language.choose('Người dùng đã xác thực', 'Authenticated User');
  }

  protected date(value: string): string {
    return new Intl.DateTimeFormat(this.language.formatLocale()).format(
      new Date(value),
    );
  }

  protected filter(debounce = false): void {
    this.page.set(1);
    this.pageInput.set(1);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (debounce) {
      this.searchTimer = setTimeout(() => this.loadUsers(), 300);
      return;
    }
    this.loadUsers();
  }

  protected askStatus(user: AdminUserView): void {
    if (user.role === USER_ROLES.SUPER_ADMIN) return;
    this.confirmUser.set(user);
    this.confirmKind.set('status');
  }

  protected askRole(
    user: AdminUserView,
    role: number,
  ): void {
    if (user.role === USER_ROLES.SUPER_ADMIN || user.role_id === role) return;
    this.confirmUser.set(user);
    this.pendingRole.set(role);
    this.confirmKind.set('role');
  }

  protected applyConfirm(): void {
    const user = this.confirmUser();
    const kind = this.confirmKind();
    if (!user || !kind || this.saving()) return;

    this.saving.set(true);
    this.clearFeedback();
    const request =
      kind === 'status'
        ? this.api.setLocked(user.id, user.isActive)
        : this.api.changeRole(user.id, this.roleFromId(this.pendingRole()));

    request
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.confirmKind.set(null);
          this.confirmUser.set(null);
          this.success.set(
            kind === 'status'
              ? this.language.choose(
                  user.isActive
                    ? 'Đã khóa tài khoản thành công.'
                    : 'Đã mở khóa tài khoản thành công.',
                  user.isActive
                    ? 'Account locked successfully.'
                    : 'Account unlocked successfully.',
                )
              : this.language.choose(
                  'Đã thay đổi vai trò thành công.',
                  'Role changed successfully.',
                ),
          );
          this.replaceUser(response.data.user);
        },
        error: (error) => this.showApiError(error),
      });
  }

  protected cancelConfirm(): void {
    if (this.saving()) return;
    this.confirmKind.set(null);
    this.confirmUser.set(null);
    this.users.update((users) => [...users]);
  }

  protected addUser(): void {
    if (this.saving()) return;
    const fullName = this.fullName().trim();
    const userName = this.userName().trim();
    const email = this.email().trim().toLowerCase();
    const password = this.password();

    if (
      fullName.length < 2
      || userName.length < 2
      || !email
      || password.length < 8
      || !/[a-z]/.test(password)
      || !/[A-Z]/.test(password)
      || !/\d/.test(password)
      || password !== this.confirmPassword()
    ) {
      this.error.set(
        this.language.choose(
          'Hãy nhập đủ thông tin. Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và phải trùng nhau.',
          'Complete all fields. Passwords must match and contain at least 8 characters, uppercase, lowercase and a number.',
        ),
      );
      return;
    }

    this.saving.set(true);
    this.clearFeedback();
    this.api
      .create({
        fullName,
        userName,
        email,
        password,
        role: this.roleFromId(this.newRole()),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.closeAdd();
          this.success.set(
            this.language.choose(
              'Tạo người dùng thành công.',
              'User created successfully.',
            ),
          );
          this.page.set(1);
          this.pageInput.set(1);
          this.loadUsers();
        },
        error: (error) => this.showApiError(error),
      });
  }

  protected openEdit(user: AdminUserView): void {
    this.clearFeedback();
    this.editUser.set(user);
    this.editFullName.set(user.fullName ?? '');
    this.editUserName.set(user.userName);
    this.editEmail.set(user.email);
    this.editPhone.set(user.phone ?? '');
    this.editOpen.set(true);
  }

  protected updateUser(): void {
    const user = this.editUser();
    if (!user || this.saving()) return;
    const fullName = this.editFullName().trim();
    const userName = this.editUserName().trim();
    const email = this.editEmail().trim().toLowerCase();
    const phone = this.editPhone().trim();
    if (fullName.length < 2 || userName.length < 2 || !email) {
      this.error.set(
        this.language.choose(
          'Họ tên, tên đăng nhập và email không hợp lệ.',
          'Full name, username and email are invalid.',
        ),
      );
      return;
    }
    if (phone && !/^(\+84|0)\d{9,10}$/.test(phone)) {
      this.error.set(
        this.language.choose(
          'Số điện thoại không đúng định dạng.',
          'Phone number has an invalid format.',
        ),
      );
      return;
    }

    this.saving.set(true);
    this.clearFeedback();
    this.api
      .update(user.id, {
        fullName,
        userName,
        email,
        phone: phone || null,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.replaceUser(response.data.user);
          this.closeEdit();
          this.success.set(
            this.language.choose(
              'Cập nhật người dùng thành công.',
              'User updated successfully.',
            ),
          );
        },
        error: (error) => this.showApiError(error),
      });
  }

  protected closeEdit(): void {
    if (this.saving()) return;
    this.editOpen.set(false);
    this.editUser.set(null);
    this.editFullName.set('');
    this.editUserName.set('');
    this.editEmail.set('');
    this.editPhone.set('');
    this.error.set('');
  }

  protected closeAdd(): void {
    if (this.saving()) return;
    this.addOpen.set(false);
    this.fullName.set('');
    this.userName.set('');
    this.email.set('');
    this.password.set('');
    this.confirmPassword.set('');
    this.newRole.set(2);
    this.showPassword.set(false);
    this.error.set('');
  }

  protected changePage(value: number): void {
    const next = Math.min(Math.max(1, value), this.totalPages());
    if (next === this.page() && this.users().length) return;
    this.page.set(next);
    this.pageInput.set(next);
    this.loadUsers();
  }

  protected applyPage(): void {
    this.changePage(this.pageInput());
  }

  protected applyPageSize(): void {
    const size = Math.min(100, Math.max(1, Math.trunc(this.sizeInput() || 1)));
    this.pageSize.set(size);
    this.sizeInput.set(size);
    this.page.set(1);
    this.pageInput.set(1);
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.clearFeedback(false);
    this.api
      .list({
        page: this.page(),
        limit: this.pageSize(),
        search: this.search().trim() || undefined,
        role: this.role() ? this.roleFromId(this.role()) : undefined,
        status: this.active()
          ? this.active() === 'active'
            ? 'ACTIVE'
            : 'LOCKED'
          : undefined,
        sort: this.sort(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.users.set(response.data.items.map((user) => this.toView(user)));
          this.total.set(response.data.pagination.total);
          const lastPage = Math.max(1, response.data.pagination.totalPages);
          if (this.page() > lastPage) {
            this.page.set(lastPage);
            this.pageInput.set(lastPage);
            this.loadUsers();
          }
        },
        error: (error) => {
          this.users.set([]);
          this.total.set(0);
          this.showApiError(error);
        },
      });
  }

  private replaceUser(updated: AdminUser): void {
    const view = this.toView(updated);
    this.users.update((users) =>
      users.map((user) => (user.id === updated.id ? view : user)),
    );
  }

  private toView(user: AdminUser): AdminUserView {
    return {
      ...user,
      user_name: user.userName,
      full_name: user.fullName,
      role_id:
        user.role === USER_ROLES.SUPER_ADMIN
          ? 1
          : user.role === USER_ROLES.BLOG_OWNER
            ? 2
            : 3,
      is_active: user.isActive,
      created_at: user.createdAt,
    };
  }

  private roleFromId(id: number): Exclude<UserRole, 'SUPER_ADMIN'> {
    return id === 2 ? USER_ROLES.BLOG_OWNER : USER_ROLES.AUTHENTICATED_USER;
  }

  private clearFeedback(clearSuccess = true): void {
    this.error.set('');
    if (clearSuccess) this.success.set('');
  }

  private showApiError(error: unknown): void {
    const normalized = this.apiErrors.normalize(error);
    const messages: Record<string, [string, string]> = {
      ADMIN_CANNOT_LOCK_SELF: [
        'Bạn không thể tự khóa tài khoản của mình.',
        'You cannot lock your own account.',
      ],
      ADMIN_CANNOT_CHANGE_OWN_ROLE: [
        'Bạn không thể tự thay đổi vai trò của mình.',
        'You cannot change your own role.',
      ],
      ADMIN_LAST_SUPER_ADMIN_MUST_REMAIN: [
        'Hệ thống phải còn ít nhất một Super Admin hoạt động.',
        'At least one active Super Admin must remain.',
      ],
      ADMIN_USER_EMAIL_ALREADY_EXISTS: [
        'Email đã được sử dụng.',
        'Email is already in use.',
      ],
      ADMIN_USER_USERNAME_ALREADY_EXISTS: [
        'Tên đăng nhập đã tồn tại.',
        'Username already exists.',
      ],
      ADMIN_USER_NOT_FOUND: [
        'Không tìm thấy người dùng.',
        'User was not found.',
      ],
    };
    const translated = messages[normalized.code];
    this.error.set(
      translated
        ? this.language.choose(...translated)
        : normalized.messages.join(' '),
    );
  }
}
