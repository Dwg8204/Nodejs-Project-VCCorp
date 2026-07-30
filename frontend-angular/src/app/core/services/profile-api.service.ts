import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  Role,
  USER_ROLES,
  User,
  UserRole,
} from '../models/auth.model';
import { ApiResponse } from '../models/api.model';
import { ApiClientService } from './api-client.service';

export interface UpdateProfilePayload {
  fullName?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
}

export type ProfileImageType = 'avatar' | 'cover';

interface ApiProfileUser extends Omit<User, 'role' | 'isActive'> {
  role: UserRole;
}
export interface PublicProfileUser {
  id: number;
  userName: string;
  fullName: string | null;
  avatar: string | null;
  coverImage: string | null;
  role: UserRole;
  createdAt: string;
}

interface ProfileImageData {
  user: ApiProfileUser;
  image: {
    type: ProfileImageType;
    url: string;
    width: number;
    height: number;
  };
}

const ROLE_IDS: Record<UserRole, number> = {
  [USER_ROLES.SUPER_ADMIN]: 1,
  [USER_ROLES.BLOG_OWNER]: 2,
  [USER_ROLES.AUTHENTICATED_USER]: 3,
};

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly api = inject(ApiClientService);

  getProfile(): Observable<ApiResponse<{ user: User }>> {
    return this.api
      .get<{ user: ApiProfileUser }>('profile')
      .pipe(map((response) => this.mapUserResponse(response)));
  }

  getPublicProfile(id: number): Observable<ApiResponse<{ user: PublicProfileUser }>> {
    return this.api.get<{ user: PublicProfileUser }>(`profiles/${id}`);
  }

  updateProfile(
    payload: UpdateProfilePayload,
  ): Observable<ApiResponse<{ user: User }>> {
    return this.api
      .patch<{ user: ApiProfileUser }>('profile', payload)
      .pipe(map((response) => this.mapUserResponse(response)));
  }

  uploadImage(
    type: ProfileImageType,
    file: File,
  ): Observable<ApiResponse<{ user: User; image: ProfileImageData['image'] }>> {
    const body = new FormData();
    body.append('file', file);
    return this.api.post<ProfileImageData>(`profile/images/${type}`, body).pipe(
      map((response) => ({
        ...response,
        data: {
          image: response.data.image,
          user: this.mapUser(response.data.user),
        },
      })),
    );
  }

  private mapUserResponse(
    response: ApiResponse<{ user: ApiProfileUser }>,
  ): ApiResponse<{ user: User }> {
    return {
      ...response,
      data: { user: this.mapUser(response.data.user) },
    };
  }

  private mapUser(user: ApiProfileUser): User {
    const role: Role = {
      id: ROLE_IDS[user.role],
      nameRole: user.role,
    };
    return { ...user, role, isActive: true };
  }
}
