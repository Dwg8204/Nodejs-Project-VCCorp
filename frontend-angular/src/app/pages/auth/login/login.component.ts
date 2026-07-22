import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { USER_ROLES, UserRole } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({ selector: 'app-login', standalone: true, imports: [ReactiveFormsModule, RouterLink], templateUrl: './login.component.html', styleUrl: './login.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly language = inject(LanguageService);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);
  protected readonly copy = computed(() => this.language.locale() === 'vi' ? {
    eyebrow: 'Chào mừng trở lại', title: 'Đăng nhập', subtitle: 'Tiếp tục đọc, viết và quản lý nội dung của bạn.', password: 'Mật khẩu', forgot: 'Quên mật khẩu?', submit: 'Đăng nhập', submitting: 'Đang đăng nhập…', noAccount: 'Chưa có tài khoản?', register: 'Đăng ký ngay', quick: 'Tài khoản kiểm thử nhanh', show: 'Hiện', hide: 'Ẩn', emailRequired: 'Vui lòng nhập email.', emailInvalid: 'Email không hợp lệ.', passwordRequired: 'Vui lòng nhập mật khẩu.'
  } : {
    eyebrow: 'Welcome back', title: 'Sign in', subtitle: 'Continue reading, writing and managing your content.', password: 'Password', forgot: 'Forgot password?', submit: 'Sign in', submitting: 'Signing in…', noAccount: 'No account yet?', register: 'Create one', quick: 'Quick test accounts', show: 'Show', hide: 'Hide', emailRequired: 'Email is required.', emailInvalid: 'Email is invalid.', passwordRequired: 'Password is required.'
  });
  protected readonly form = this.formBuilder.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true); this.errorMessage.set('');
    this.auth.login(this.form.getRawValue()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ data }) => this.navigateAfterLogin(data.user.role.nameRole),
      error: (error: unknown) => this.errorMessage.set(error instanceof Error ? error.message : 'Không thể đăng nhập.'),
    });
  }

  protected quickLogin(email: string): void {
    this.form.setValue({ email, password: '123456' });
    this.submit();
  }

  private navigateAfterLogin(role: UserRole): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl?.startsWith('/')) { void this.router.navigateByUrl(returnUrl); return; }
    if (role === USER_ROLES.SUPER_ADMIN) void this.router.navigate(['/admin/dashboard']);
    else if (role === USER_ROLES.BLOG_OWNER) void this.router.navigate(['/owner/posts']);
    else void this.router.navigate(['/']);
  }
}
