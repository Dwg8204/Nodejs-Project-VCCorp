import { Observable } from 'rxjs';

import { ApiResponse } from '../../core/models/api.model';
import {
  AuthData,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  User,
  VerifyOtpData,
  VerifyOtpRequest,
} from '../../core/models/auth.model';

export abstract class AuthRepository {
  abstract login(request: LoginRequest): Observable<ApiResponse<AuthData>>;
  abstract register(request: RegisterRequest): Observable<ApiResponse<AuthData>>;
  abstract getCurrentUser(): Observable<ApiResponse<{ user: User }>>;
  abstract logout(user?: User | null): Observable<ApiResponse<null>>;
  abstract forgotPassword(
    request: ForgotPasswordRequest,
  ): Observable<ApiResponse<null>>;
  abstract verifyOtp(
    request: VerifyOtpRequest,
  ): Observable<ApiResponse<VerifyOtpData>>;
  abstract resetPassword(
    request: ResetPasswordRequest,
  ): Observable<ApiResponse<null>>;
}
