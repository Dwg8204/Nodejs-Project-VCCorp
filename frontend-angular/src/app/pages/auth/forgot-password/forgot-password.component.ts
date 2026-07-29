import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

type RecoveryStep = 'request' | 'verify' | 'reset' | 'success';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('newPassword')?.value
    === control.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  protected readonly step = signal<RecoveryStep>('request');
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);
  private readonly resetToken = signal('');

  protected readonly copy = computed(() => this.language.chooseObject({
    title: 'Khôi phục mật khẩu',
    requestSubtitle: 'Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.',
    verifySubtitle: 'Nhập mã OTP gồm 6 chữ số đã được gửi cho bạn.',
    resetSubtitle: 'Tạo mật khẩu mới cho tài khoản của bạn.',
    send: 'Gửi mã OTP',
    sending: 'Đang gửi…',
    verify: 'Xác minh OTP',
    verifying: 'Đang xác minh…',
    reset: 'Đặt lại mật khẩu',
    resetting: 'Đang cập nhật…',
    back: 'Quay lại đăng nhập',
    emailInvalid: 'Vui lòng nhập email hợp lệ.',
    otp: 'Mã OTP',
    otpInvalid: 'Mã OTP phải gồm đúng 6 chữ số.',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu',
    passwordRule: 'Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.',
    mismatch: 'Mật khẩu xác nhận không khớp.',
    success: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    resend: 'Gửi lại mã',
    changeEmail: 'Đổi email',
    show: 'Hiện',
    hide: 'Ẩn',
  }, {
    title: 'Recover password',
    requestSubtitle: 'Enter your registered email to receive a password reset OTP.',
    verifySubtitle: 'Enter the six-digit OTP sent to you.',
    resetSubtitle: 'Create a new password for your account.',
    send: 'Send OTP',
    sending: 'Sending…',
    verify: 'Verify OTP',
    verifying: 'Verifying…',
    reset: 'Reset password',
    resetting: 'Updating…',
    back: 'Back to sign in',
    emailInvalid: 'Enter a valid email address.',
    otp: 'OTP code',
    otpInvalid: 'The OTP must contain exactly six digits.',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    passwordRule: 'Use at least 8 characters with uppercase, lowercase and a number.',
    mismatch: 'The passwords do not match.',
    success: 'Your password has been reset. You can now sign in with the new password.',
    resend: 'Resend code',
    changeEmail: 'Change email',
    show: 'Show',
    hide: 'Hide',
  }));

  protected readonly emailForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly otpForm = this.formBuilder.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  protected readonly resetForm = this.formBuilder.nonNullable.group(
    {
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected requestOtp(): void {
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth
      .forgotPassword(this.emailForm.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.step.set('verify'),
        error: (error: unknown) => this.showError(error),
      });
  }

  protected verifyOtp(): void {
    this.otpForm.markAllAsTouched();
    if (this.otpForm.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth
      .verifyOtp({
        email: this.emailForm.controls.email.value,
        otp: this.otpForm.controls.otp.value,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ data }) => {
          this.resetToken.set(data.resetToken);
          this.step.set('reset');
        },
        error: (error: unknown) => this.showError(error),
      });
  }

  protected resetPassword(): void {
    this.resetForm.markAllAsTouched();
    if (this.resetForm.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.auth
      .resetPassword({
        resetToken: this.resetToken(),
        ...this.resetForm.getRawValue(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.step.set('success'),
        error: (error: unknown) => this.showError(error),
      });
  }

  protected changeEmail(): void {
    this.errorMessage.set('');
    this.otpForm.reset();
    this.step.set('request');
  }

  private showError(error: unknown): void {
    this.errorMessage.set(
      error instanceof Error
        ? error.message
        : this.language.choose(
          'Không thể hoàn tất yêu cầu.',
          'Unable to complete the request.',
        ),
    );
  }
}
