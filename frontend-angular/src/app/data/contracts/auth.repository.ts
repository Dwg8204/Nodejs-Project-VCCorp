import { Observable } from 'rxjs';

import { ApiResponse } from '../../core/models/api.model';
import { AuthData, LoginRequest, RegisterRequest, User } from '../../core/models/auth.model';

export abstract class AuthRepository {
  abstract login(request: LoginRequest): Observable<ApiResponse<AuthData>>;
  abstract register(request: RegisterRequest): Observable<ApiResponse<AuthData>>;
  abstract getProfile(userId: number): Observable<ApiResponse<{ user: User }>>;
  abstract logout(user: User | null): void;
}
