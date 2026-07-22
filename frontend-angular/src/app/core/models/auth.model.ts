export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BLOG_OWNER: 'BLOG_OWNER',
  AUTHENTICATED_USER: 'AUTHENTICATED_USER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface Role {
  id: number;
  nameRole: UserRole;
}

export interface User {
  id: number;
  userName: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  emailVerified: boolean;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthData {
  user: User;
  token: string;
}
