import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ApiResponse } from '../models/api.model';
import {
  AuthData,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
} from '../models/auth.model';
import { StorageService } from './storage.service';
import { AuthRepository } from '../../data/contracts/auth.repository';

export const AUTH_STORAGE_KEYS = {
  token: 'vccorp_access_token',
  user: 'vccorp_current_user',
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repository = inject(AuthRepository);
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
    return this.repository.login(request)
      .pipe(tap((response) => this.persistSession(response.data)));
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthData>> {
    return this.repository.register(request)
      .pipe(tap((response) => this.persistSession(response.data)));
  }

  refreshProfile(): Observable<ApiResponse<{ user: User }>> {
    const userId = this.currentUser()?.id;
    if (!userId) throw new Error('Không có phiên đăng nhập.');
    return this.repository.getProfile(userId)
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
    this.repository.logout(this.userState());
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
