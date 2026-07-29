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
import { LanguageService } from './language.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repository = inject(AuthRepository);
  private readonly storage = inject(StorageService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly session = inject(AuthSessionStore);
  private readonly language = inject(LanguageService);
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
    const key = `auth.error.${error.code}`;
    const translated = this.language.translate(key);
    return translated !== key
      ? translated
      : error.messages[0] ?? this.language.translate('auth.error.generic');
  }
}
