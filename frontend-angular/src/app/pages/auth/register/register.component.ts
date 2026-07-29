import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

function passwordMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('password')?.value === control.get('confirmPassword')?.value ? null : { passwordMismatch: true };
}

@Component({ selector: 'app-register', standalone: true, imports: [ReactiveFormsModule, RouterLink], templateUrl: './register.component.html', styleUrl: './register.component.scss', changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly language = inject(LanguageService);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);
  protected readonly copy = computed(() => this.language.chooseObject({
    eyebrow: 'Tham gia cộng đồng', title: 'Tạo tài khoản', subtitle: 'Tài khoản mới được tạo với vai trò người dùng đã xác thực.', fullName: 'Họ và tên', userName: 'Tên người dùng', password: 'Mật khẩu', confirm: 'Xác nhận mật khẩu', submit: 'Đăng ký', submitting: 'Đang tạo tài khoản…', hasAccount: 'Đã có tài khoản?', login: 'Đăng nhập', required: 'Trường này là bắt buộc.', invalidEmail: 'Email không hợp lệ.', username: 'Tên người dùng cần từ 2 đến 50 ký tự.', passwordRule: 'Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.', mismatch: 'Mật khẩu xác nhận không khớp.', terms: 'Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng của hệ thống.'
  }, {
    eyebrow: 'Join the community', title: 'Create an account', subtitle: 'New accounts use the authenticated user role.', fullName: 'Full name', userName: 'Username', password: 'Password', confirm: 'Confirm password', submit: 'Create account', submitting: 'Creating account…', hasAccount: 'Already have an account?', login: 'Sign in', required: 'This field is required.', invalidEmail: 'Email is invalid.', username: 'Username must contain 2–50 characters.', passwordRule: 'At least 8 characters with uppercase, lowercase and a number.', mismatch: 'Passwords do not match.', terms: 'By registering, you agree to the system terms of use.'
  }));
  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(255)]],
    userName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatch });

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true); this.errorMessage.set('');
    this.auth.register(this.form.getRawValue()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (error: unknown) => this.errorMessage.set(
        error instanceof Error
          ? error.message
          : this.language.translate('auth.error.generic'),
      ),
    });
  }
}
