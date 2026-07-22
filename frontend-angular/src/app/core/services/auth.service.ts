import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/api.model';
import {
  AuthData,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
} from '../models/auth.model';
import { StorageService } from './storage.service';

export const AUTH_STORAGE_KEYS = {
  token: 'vccorp_access_token',
  user: 'vccorp_current_user',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly userState = signal<User | null>(
    this.storage.get<User>(AUTH_STORAGE_KEYS.user),
  );

  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(
    () => Boolean(this.userState() && this.getAccessToken()),
  );
  readonly role = computed(() => this.userState()?.role?.nameRole ?? null);

  login(request: LoginRequest): Observable<ApiResponse<AuthData>> {
    return this.http
      .post<ApiResponse<AuthData>>(`${APP_CONFIG.apiBaseUrl}/auth/login`, request)
      .pipe(tap((response) => this.persistSession(response.data)));
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthData>> {
    return this.http
      .post<ApiResponse<AuthData>>(`${APP_CONFIG.apiBaseUrl}/auth/register`, request)
      .pipe(tap((response) => this.persistSession(response.data)));
  }

  refreshProfile(): Observable<ApiResponse<{ user: User }>> {
    return this.http
      .get<ApiResponse<{ user: User }>>(`${APP_CONFIG.apiBaseUrl}/users/profile`)
      .pipe(tap((response) => this.setUser(response.data.user)));
  }

  getAccessToken(): string | null {
    return this.storage.get<string>(AUTH_STORAGE_KEYS.token);
  }

  hasRole(roles: readonly UserRole[]): boolean {
    const currentRole = this.role();
    return currentRole !== null && roles.includes(currentRole);
  }

  logout(): void {
    this.storage.remove(AUTH_STORAGE_KEYS.token);
    this.storage.remove(AUTH_STORAGE_KEYS.user);
    this.userState.set(null);
  }

  private persistSession(data: AuthData): void {
    this.storage.set(AUTH_STORAGE_KEYS.token, data.token);
    this.setUser(data.user);
  }

  private setUser(user: User): void {
    this.storage.set(AUTH_STORAGE_KEYS.user, user);
    this.userState.set(user);
  }
}
