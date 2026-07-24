import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';

import { ApiResponse } from '../../core/models/api.model';
import { AuthData, LoginRequest, RegisterRequest, User } from '../../core/models/auth.model';
import { AuthRepository } from '../contracts/auth.repository';
import { MOCK_SEED_PASSWORD } from './mock.seed';
import { RoleRow, UserRow } from './mock-schema.model';
import { MockDatabaseService } from './mock-database.service';

export class MockAuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

@Injectable()
export class MockAuthRepository implements AuthRepository {
  constructor(private readonly database: MockDatabaseService) {}

  login(request: LoginRequest): Observable<ApiResponse<AuthData>> {
    const email = request.email.trim().toLowerCase();
    const user = this.database.table('users').find((item) => item.email.toLowerCase() === email);
    const registeredPassword = this.database.getRegisteredPassword(email);
    const passwordMatches = registeredPassword
      ? request.password === registeredPassword
      : request.password === MOCK_SEED_PASSWORD;

    if (!user || !passwordMatches) {
      this.writeAudit(null, 'AUTH_LOGIN_FAILED', 'AUTH', null, email, { email });
      return throwError(() => new MockAuthError('Email hoặc mật khẩu không đúng.', 401));
    }
    if (!user.is_active) {
      this.writeAudit(user, 'AUTH_ACCESS_DENIED', 'AUTH', user.id, user.email, { reason: 'ACCOUNT_LOCKED' });
      return throwError(() => new MockAuthError('Tài khoản đã bị khóa.', 403));
    }

    const mappedUser = this.mapUser(user);
    const token = `mock.${btoa(JSON.stringify({ id: user.id, role: mappedUser.role.nameRole }))}.signature`;
    this.writeAudit(user, 'AUTH_LOGIN_SUCCEEDED', 'AUTH', user.id, user.email, null);
    return of({ success: true, message: 'Đăng nhập thành công', data: { user: mappedUser, token } }).pipe(delay(450));
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthData>> {
    const users = this.database.table('users');
    const email = request.email.trim().toLowerCase();
    const userName = request.userName.trim();
    if (users.some((user) => user.email.toLowerCase() === email)) {
      return throwError(() => new MockAuthError('Email đã được sử dụng.', 409));
    }
    if (users.some((user) => user.user_name.toLowerCase() === userName.toLowerCase())) {
      return throwError(() => new MockAuthError('Tên người dùng đã được sử dụng.', 409));
    }
    if (request.password !== request.confirmPassword) {
      return throwError(() => new MockAuthError('Mật khẩu xác nhận không khớp.', 400));
    }

    const timestamp = new Date().toISOString();
    const row: UserRow = {
      id: this.database.nextId('users'), user_name: userName, email,
      full_name: request.fullName.trim() || null, phone: null, avatar: null,
      cover_image: null, date_of_birth: null, is_active: true,
      password_hash: '$mock-bcrypt-hash$', email_verified: false, role_id: 3,
      otp_code: null, otp_created_at: null, otp_ttl_seconds: 180,
      created_at: timestamp, updated_at: timestamp,
    };
    users.push(row);
    this.database.write('users', users);
    this.database.setRegisteredPassword(email, request.password);
    this.writeAudit(row, 'USER_CREATED', 'USER', row.id, row.full_name ?? row.user_name, { source: 'SELF_REGISTRATION' });

    const user = this.mapUser(row);
    const token = `mock.${btoa(JSON.stringify({ id: row.id, role: user.role.nameRole }))}.signature`;
    return of({ success: true, message: 'Đăng ký thành công', data: { user, token } }).pipe(delay(550));
  }

  getProfile(userId: number): Observable<ApiResponse<{ user: User }>> {
    const row = this.database.table('users').find((user) => user.id === userId);
    return row
      ? of({ success: true, message: 'Lấy hồ sơ thành công', data: { user: this.mapUser(row) } }).pipe(delay(250))
      : throwError(() => new MockAuthError('Không tìm thấy người dùng.', 404));
  }

  logout(user: User | null): void {
    if (!user) return;
    const row = this.database.table('users').find((item) => item.id === user.id) ?? null;
    this.writeAudit(row, 'AUTH_LOGOUT', 'AUTH', user.id, user.email, null);
  }

  private mapUser(row: UserRow): User {
    const role = this.database.table('role').find((item) => item.id === row.role_id);
    if (!role) throw new MockAuthError('Dữ liệu vai trò không hợp lệ.', 500);
    return {
      id: row.id, userName: row.user_name, fullName: row.full_name,
      email: row.email, phone: row.phone, avatar: row.avatar,
      isActive: row.is_active, emailVerified: row.email_verified,
      role: { id: role.id, nameRole: role.name_role },
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  private writeAudit(actor: UserRow | null, action: string, entityType: string, entityId: number | null, label: string, metadata: Record<string, unknown> | null): void {
    const role = actor ? this.database.table('role').find((item: RoleRow) => item.id === actor.role_id) : null;
    this.database.appendAuditLog({
      id: this.database.nextId('audit_logs'), actor_id: actor?.id ?? null,
      actor_name: actor?.full_name ?? actor?.user_name ?? null,
      actor_role: role?.name_role ?? null, action, entity_type: entityType,
      entity_id: entityId, entity_label: label, before_data: null, after_data: null,
      metadata, ip_address: '127.0.0.1', user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
    });
  }
}
