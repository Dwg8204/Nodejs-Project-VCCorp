import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, PaginatedData } from '../models/api.model';
import { UserRole } from '../models/auth.model';
import { ApiClientService } from './api-client.service';

export type AdminUserStatus = 'ACTIVE' | 'LOCKED';
export type AdminUserSort = 'newest' | 'oldest' | 'a-z' | 'z-a';

export interface AdminUser {
  id: number;
  userName: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatar: string | null;
  coverImage: string | null;
  dateOfBirth: string | null;
  emailVerified: boolean;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersQuery {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: AdminUserStatus;
  sort?: AdminUserSort;
}

export interface CreateAdminUserPayload {
  userName: string;
  email: string;
  fullName: string;
  password: string;
  role: Exclude<UserRole, 'SUPER_ADMIN'>;
}

export interface UpdateAdminUserPayload {
  userName?: string;
  email?: string;
  fullName?: string | null;
  phone?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  private readonly api = inject(ApiClientService);

  list(query: AdminUsersQuery): Observable<ApiResponse<PaginatedData<AdminUser>>> {
    return this.api.get<PaginatedData<AdminUser>>('admin/users', {
      query: { ...query },
    });
  }

  create(payload: CreateAdminUserPayload): Observable<ApiResponse<{ user: AdminUser }>> {
    return this.api.post<{ user: AdminUser }>('admin/users', payload);
  }

  update(
    id: number,
    payload: UpdateAdminUserPayload,
  ): Observable<ApiResponse<{ user: AdminUser }>> {
    return this.api.patch<{ user: AdminUser }>(`admin/users/${id}`, payload);
  }

  changeRole(
    id: number,
    role: Exclude<UserRole, 'SUPER_ADMIN'>,
  ): Observable<ApiResponse<{ user: AdminUser }>> {
    return this.api.patch<{ user: AdminUser }>(`admin/users/${id}/role`, { role });
  }

  setLocked(
    id: number,
    locked: boolean,
  ): Observable<ApiResponse<{ user: AdminUser }>> {
    return this.api.patch<{ user: AdminUser }>(
      `admin/users/${id}/${locked ? 'lock' : 'unlock'}`,
      {},
    );
  }
}
