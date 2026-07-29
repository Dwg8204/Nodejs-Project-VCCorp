import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  map,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';

import { AuthRepository } from '../../data/contracts/auth.repository';
import {
  AuthData,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
  UserRole,
  VerifyOtpData,
  VerifyOtpRequest,
} from '../models/auth.model';
import { ApiResponse, NormalizedApiError } from '../models/api.model';
import { ApiErrorService } from './api-error.service';
import { AuthSessionStore } from './auth-session.store';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repository = inject(AuthRepository);
  private readonly storage = inject(StorageService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly session = inject(AuthSessionStore);
  private readonly sessionReadyState = signal(false);

  readonly currentUser = this.session.user;
  readonly sessionReady = this.sessionReadyState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.currentUser()));
  readonly role = computed(() => this.currentUser()?.role?.nameRole ?? null);

  login(request: LoginRequest): Observable<ApiResponse<AuthData>> {
    return this.repository.login(request).pipe(
      tap((response) => this.persistSession(response.data)),
      catchError((error) => this.rethrowFriendly(error)),
    );
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthData>> {
    return this.repository.register(request).pipe(
      tap((response) => this.persistSession(response.data)),
      catchError((error) => this.rethrowFriendly(error)),
    );
  }

  refreshProfile(): Observable<ApiResponse<{ user: User }>> {
    return this.repository.getCurrentUser().pipe(
      tap((response) => this.setUser(response.data.user)),
      catchError((error) => this.rethrowFriendly(error)),
    );
  }

  initializeSession(): Observable<void> {
    // One-time cleanup for sessions created before HttpOnly cookie auth.
    this.storage.remove('vccorp_access_token');
    this.storage.remove('vccorp_current_user');
    return this.repository.getCurrentUser().pipe(
      tap((response) => this.setUser(response.data.user)),
      map(() => undefined),
      catchError(() => {
        this.clearSession();
        return of(undefined);
      }),
      tap(() => this.sessionReadyState.set(true)),
    );
  }

  hasRole(roles: readonly UserRole[]): boolean {
    const currentRole = this.role();
    return currentRole !== null && roles.includes(currentRole);
  }

  syncCurrentUser(user: User): void {
    this.setUser(user);
  }

  logout(): void {
    const user = this.currentUser();
    this.repository.logout(user).subscribe({ error: () => undefined });
    this.clearSession();
  }

  forgotPassword(
    request: ForgotPasswordRequest,
  ): Observable<ApiResponse<null>> {
    return this.repository
      .forgotPassword(request)
      .pipe(catchError((error) => this.rethrowFriendly(error)));
  }

  verifyOtp(
    request: VerifyOtpRequest,
  ): Observable<ApiResponse<VerifyOtpData>> {
    return this.repository
      .verifyOtp(request)
      .pipe(catchError((error) => this.rethrowFriendly(error)));
  }

  resetPassword(
    request: ResetPasswordRequest,
  ): Observable<ApiResponse<null>> {
    return this.repository
      .resetPassword(request)
      .pipe(catchError((error) => this.rethrowFriendly(error)));
  }

  private persistSession(data: AuthData): void {
    this.setUser(data.user);
  }

  private setUser(user: User): void {
    this.session.setUser(user);
  }

  private clearSession(): void {
    this.session.clear();
  }

  private rethrowFriendly(error: unknown): Observable<never> {
    const normalized = this.apiErrors.normalize(error);
    return throwError(() => new Error(this.authErrorMessage(normalized)));
  }

  private authErrorMessage(error: NormalizedApiError): string {
    const vi: Record<string, string> = {
      AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
      AUTH_ACCOUNT_LOCKED: 'Tài khoản đã bị khóa.',
      AUTH_EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng.',
      AUTH_USERNAME_ALREADY_EXISTS: 'Tên người dùng đã được sử dụng.',
      AUTH_PASSWORD_CONFIRMATION_MISMATCH: 'Mật khẩu xác nhận không khớp.',
      AUTH_PASSWORD_COMPLEXITY_REQUIRED:
        'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.',
      AUTH_OTP_INVALID_OR_EXPIRED: 'Mã OTP không đúng hoặc đã hết hạn.',
      AUTH_OTP_ATTEMPTS_EXCEEDED:
        'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới.',
      AUTH_RESET_TOKEN_INVALID_OR_EXPIRED:
        'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      AUTH_RESET_EMAIL_NOT_CONFIGURED:
        'Hệ thống chưa được cấu hình email gửi mã OTP.',
      AUTH_RESET_EMAIL_SEND_FAILED:
        'Không thể gửi email OTP. Vui lòng thử lại sau.',
    };
    const en: Record<string, string> = {
      AUTH_INVALID_CREDENTIALS: 'The email or password is incorrect.',
      AUTH_ACCOUNT_LOCKED: 'This account has been locked.',
      AUTH_EMAIL_ALREADY_EXISTS: 'This email is already in use.',
      AUTH_USERNAME_ALREADY_EXISTS: 'This username is already in use.',
      AUTH_PASSWORD_CONFIRMATION_MISMATCH: 'The passwords do not match.',
      AUTH_PASSWORD_COMPLEXITY_REQUIRED:
        'Use at least 8 characters with uppercase, lowercase and a number.',
      AUTH_OTP_INVALID_OR_EXPIRED: 'The OTP is invalid or has expired.',
      AUTH_OTP_ATTEMPTS_EXCEEDED:
        'Too many invalid OTP attempts. Please request a new code.',
      AUTH_RESET_TOKEN_INVALID_OR_EXPIRED:
        'The password reset session is invalid or has expired.',
      AUTH_RESET_EMAIL_NOT_CONFIGURED:
        'The OTP email service has not been configured.',
      AUTH_RESET_EMAIL_SEND_FAILED:
        'Unable to send the OTP email. Please try again later.',
    };
    const locale = this.storage.get<string>('blog-lang') ?? 'vi';
    const messages = locale === 'vi' ? vi : en;
    return messages[error.code]
      ?? error.messages[0]
      ?? (locale === 'vi'
        ? 'Không thể hoàn tất yêu cầu.'
        : 'Unable to complete the request.');
  }
}
