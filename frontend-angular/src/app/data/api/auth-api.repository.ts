import { HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  AuthData,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  Role,
  USER_ROLES,
  User,
  UserRole,
  VerifyOtpData,
  VerifyOtpRequest,
} from '../../core/models/auth.model';
import { ApiResponse } from '../../core/models/api.model';
import {
  SKIP_AUTH_REDIRECT,
  SKIP_AUTH_REFRESH,
  SKIP_AUTH_TOKEN,
} from '../../core/http/http-context.tokens';
import { ApiClientService } from '../../core/services/api-client.service';
import { AuthRepository } from '../contracts/auth.repository';

interface ApiUser {
  id: number;
  userName: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatar: string | null;
  coverImage?: string | null;
  dateOfBirth?: string | null;
  emailVerified: boolean;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiAuthData {
  user: ApiUser;
}

const PUBLIC_AUTH_CONTEXT = new HttpContext()
  .set(SKIP_AUTH_TOKEN, true)
  .set(SKIP_AUTH_REDIRECT, true)
  .set(SKIP_AUTH_REFRESH, true);

const ROLE_IDS: Record<UserRole, number> = {
  [USER_ROLES.SUPER_ADMIN]: 1,
  [USER_ROLES.BLOG_OWNER]: 2,
  [USER_ROLES.AUTHENTICATED_USER]: 3,
};

@Injectable()
export class AuthApiRepository implements AuthRepository {
  private readonly api = inject(ApiClientService);

  login(request: LoginRequest): Observable<ApiResponse<AuthData>> {
    return this.api
      .post<ApiAuthData>('auth/login', request, {
        context: PUBLIC_AUTH_CONTEXT,
      })
      .pipe(map((response) => this.mapAuthResponse(response)));
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthData>> {
    return this.api
      .post<ApiAuthData>('auth/register', request, {
        context: PUBLIC_AUTH_CONTEXT,
      })
      .pipe(map((response) => this.mapAuthResponse(response)));
  }

  getCurrentUser(): Observable<ApiResponse<{ user: User }>> {
    const context = new HttpContext().set(SKIP_AUTH_REDIRECT, true);
    return this.api
      .get<{ user: ApiUser }>('auth/me', { context })
      .pipe(
        map((response) => ({
          ...response,
          data: { user: this.mapUser(response.data.user) },
        })),
      );
  }

  logout(): Observable<ApiResponse<null>> {
    return this.api.post<null>('auth/logout', {});
  }

  forgotPassword(
    request: ForgotPasswordRequest,
  ): Observable<ApiResponse<null>> {
    return this.api.post<null>(
      'auth/forgot-password',
      request,
      { context: PUBLIC_AUTH_CONTEXT },
    );
  }

  verifyOtp(
    request: VerifyOtpRequest,
  ): Observable<ApiResponse<VerifyOtpData>> {
    return this.api.post<VerifyOtpData>('auth/verify-otp', request, {
      context: PUBLIC_AUTH_CONTEXT,
    });
  }

  resetPassword(
    request: ResetPasswordRequest,
  ): Observable<ApiResponse<null>> {
    return this.api.post<null>('auth/reset-password', request, {
      context: PUBLIC_AUTH_CONTEXT,
    });
  }

  private mapAuthResponse(
    response: ApiResponse<ApiAuthData>,
  ): ApiResponse<AuthData> {
    return {
      ...response,
      data: {
        user: this.mapUser(response.data.user),
      },
    };
  }

  private mapUser(user: ApiUser): User {
    const role: Role = {
      id: ROLE_IDS[user.role],
      nameRole: user.role,
    };
    return {
      ...user,
      role,
      isActive: true,
    };
  }
}
