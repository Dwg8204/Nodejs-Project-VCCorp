import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('AUTH_TOKEN_REQUIRED');
    }

    const token = authorization.slice(7).trim();
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
}
