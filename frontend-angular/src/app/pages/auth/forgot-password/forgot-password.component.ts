import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../../core/services/language.service';
import { MockDatabaseService } from '../../../data/mock/mock-database.service';

@Component({ selector: 'app-forgot-password', standalone: true, imports: [ReactiveFormsModule, RouterLink], templateUrl: './forgot-password.component.html', styleUrl: './forgot-password.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly database = inject(MockDatabaseService);
  protected readonly language = inject(LanguageService);
  protected readonly submitted = signal(false);
  protected readonly copy = computed(() => this.language.locale() === 'vi' ? {
    eyebrow: 'Khôi phục tài khoản', title: 'Quên mật khẩu?', subtitle: 'Nhập email để tạo mã OTP thử nghiệm.', submit: 'Tạo mã OTP', back: 'Quay lại đăng nhập', success: 'Nếu email tồn tại, mã OTP mock đã được tạo.', mock: 'Trong chế độ mock, mã kiểm thử là 123456 và có hiệu lực trong 180 giây.', invalid: 'Vui lòng nhập email hợp lệ.'
  } : {
    eyebrow: 'Account recovery', title: 'Forgot password?', subtitle: 'Enter your email to generate a test OTP.', submit: 'Generate OTP', back: 'Back to sign in', success: 'If the email exists, a mock OTP has been generated.', mock: 'In mock mode, the test code is 123456 and remains valid for 180 seconds.', invalid: 'Enter a valid email address.'
  });
  protected readonly form = this.formBuilder.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const users = this.database.table('users');
    const user = users.find((item) => item.email.toLowerCase() === this.form.controls.email.value.trim().toLowerCase());
    if (user) {
      user.otp_code = '123456'; user.otp_created_at = new Date().toISOString(); user.otp_ttl_seconds = 180; user.updated_at = user.otp_created_at;
      this.database.write('users', users);
    }
    this.submitted.set(true);
  }
}
