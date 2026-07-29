import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'modules/user/models/user';
import { Repository } from 'typeorm';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../interfaces/auth-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token =
      this.readCookie(
        request.headers.cookie,
        this.config.getOrThrow<string>('AUTH_COOKIE_NAME'),
      ) ?? this.readBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('AUTH_TOKEN_REQUIRED');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('AUTH_TOKEN_EXPIRED');
      }
      throw new UnauthorizedException('AUTH_TOKEN_INVALID');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('AUTH_USER_NOT_FOUND');
    }
    if (!user.isActive) {
      throw new ForbiddenException('AUTH_ACCOUNT_LOCKED');
    }

    const passwordChangedAt = user.passwordChangedAt
      ? Math.floor(user.passwordChangedAt.getTime() / 1000)
      : 0;
    if (
      passwordChangedAt &&
      passwordChangedAt > (payload.iat ?? 0)
    ) {
      throw new UnauthorizedException('AUTH_TOKEN_REVOKED');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      userName: user.userName,
      fullName: user.fullName,
      role: user.role.nameRole,
    };
    request.user = authenticatedUser;
    return true;
  }

  private readBearerToken(authorization?: string): string | null {
    if (!authorization?.startsWith('Bearer ')) return null;
    return authorization.slice(7).trim() || null;
  }

  private readCookie(header: string | undefined, name: string): string | null {
    if (!header) return null;
    for (const entry of header.split(';')) {
      const separator = entry.indexOf('=');
      if (separator < 0) continue;
      const key = entry.slice(0, separator).trim();
      if (key !== name) continue;
      const value = entry.slice(separator + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
    return null;
  }
}
