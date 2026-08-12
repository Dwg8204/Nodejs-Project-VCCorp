import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { User } from 'modules/user/models/user';
import { DataSource, Repository } from 'typeorm';
import { JwtPayload, RefreshTokenPayload } from '../interfaces/auth-user.interface';

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthTokenService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(user: User): Promise<AuthTokenPair> {
    const refreshToken = await this.signRefresh(user.id);
    await this.users.update(user.id, {
      refreshTokenHash: this.hash(refreshToken),
      refreshTokenExpiresAt: this.refreshExpiry(),
    });
    return { accessToken: await this.signAccess(user), refreshToken };
  }

  async rotate(refreshToken: string): Promise<AuthTokenPair> {
    const payload = await this.verifyRefresh(refreshToken);
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const user = await repository.createQueryBuilder('user')
        .setLock('pessimistic_write')
        .addSelect(['user.refreshTokenHash', 'user.refreshTokenExpiresAt'])
        .leftJoinAndSelect('user.role', 'role')
        .where('user.id = :id', { id: payload.sub })
        .getOne();
      if (
        !user ||
        !user.refreshTokenHash ||
        !user.refreshTokenExpiresAt ||
        user.refreshTokenExpiresAt <= new Date() ||
        !this.hashEquals(this.hash(refreshToken), user.refreshTokenHash)
      ) {
        throw new UnauthorizedException('AUTH_REFRESH_TOKEN_INVALID_OR_EXPIRED');
      }
      if (!user.isActive) {
        user.refreshTokenHash = null;
        user.refreshTokenExpiresAt = null;
        await repository.save(user);
        throw new ForbiddenException('AUTH_ACCOUNT_LOCKED');
      }
      const nextRefreshToken = await this.signRefresh(user.id);
      user.refreshTokenHash = this.hash(nextRefreshToken);
      user.refreshTokenExpiresAt = this.refreshExpiry();
      await repository.save(user);
      return {
        accessToken: await this.signAccess(user),
        refreshToken: nextRefreshToken,
      };
    });
  }

  async revoke(refreshToken?: string | null): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.verifyRefresh(refreshToken);
      await this.users.createQueryBuilder()
        .update(User)
        .set({ refreshTokenHash: null, refreshTokenExpiresAt: null })
        .where('id = :id AND refresh_token_hash = :hash', {
          id: payload.sub,
          hash: this.hash(refreshToken),
        })
        .execute();
    } catch {
      // Logout remains idempotent for expired or malformed cookies.
    }
  }

  async revokeUser(userId: number): Promise<void> {
    await this.users.update(userId, {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
  }

  private signAccess(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.userName,
      role: user.role.nameRole,
    };
    return this.jwt.signAsync(payload);
  }

  private signRefresh(userId: number): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, jti: randomUUID(), type: 'refresh' } satisfies RefreshTokenPayload,
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as never,
      },
    );
  }

  private async verifyRefresh(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'refresh') throw new Error('wrong token type');
      return payload;
    } catch {
      throw new UnauthorizedException('AUTH_REFRESH_TOKEN_INVALID_OR_EXPIRED');
    }
  }

  private refreshExpiry(): Date {
    return new Date(
      Date.now() +
        this.config.getOrThrow<number>('AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS') * 1000,
    );
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private hashEquals(left: string, right: string): boolean {
    const a = Buffer.from(left, 'hex');
    const b = Buffer.from(right, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
