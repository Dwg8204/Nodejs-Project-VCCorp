import { RoleName } from 'common/enums/database.enums';

export interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  role: RoleName;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  userName: string;
  fullName: string | null;
  role: RoleName;
}

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}
