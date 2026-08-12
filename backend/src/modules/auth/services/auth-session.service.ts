import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { User } from 'modules/user/models/user';
import { DataSource, Repository } from 'typeorm';
import { JwtPayload, RefreshTokenPayload, RequestContext } from '../interfaces/auth-user.interface';
import { UserSession } from '../models/user-session';

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthSessionService {
  constructor(
    @InjectRepository(UserSession) private readonly sessions: Repository<UserSession>,
    private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async create(user: User, context: RequestContext): Promise<AuthTokenPair> {
    const id = randomUUID();
    const refreshToken = await this.signRefresh(user.id, id);
    await this.sessions.save(this.sessions.create({
      id,
      userId: user.id,
      refreshTokenHash: this.hash(refreshToken),
      expiresAt: this.refreshExpiry(),
      revokedAt: null,
      lastUsedAt: null,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent?.slice(0, 500) ?? null,
    }));
    return { accessToken: await this.signAccess(user), refreshToken };
  }

  async rotate(refreshToken: string, context: RequestContext): Promise<{ tokens: AuthTokenPair; user: User }> {
    const payload = await this.verifyRefresh(refreshToken);
    const result = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(UserSession);
      const session = await repository.createQueryBuilder('session')
        .setLock('pessimistic_write')
        .addSelect('session.refreshTokenHash')
        .leftJoinAndSelect('session.user', 'user')
        .leftJoinAndSelect('user.role', 'role')
        .where('session.id = :id', { id: payload.sid })
        .getOne();
      if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) {
        throw new UnauthorizedException('AUTH_REFRESH_TOKEN_INVALID_OR_EXPIRED');
      }
      if (!this.hashEquals(this.hash(refreshToken), session.refreshTokenHash)) {
        return { reusedSession: { id: session.id, userId: session.userId } } as const;
      }
      if (!session.user.isActive) {
        session.revokedAt = new Date();
        await repository.save(session);
        throw new ForbiddenException('AUTH_ACCOUNT_LOCKED');
      }
      const nextRefreshToken = await this.signRefresh(session.userId, session.id);
      session.refreshTokenHash = this.hash(nextRefreshToken);
      session.expiresAt = this.refreshExpiry();
      session.lastUsedAt = new Date();
      session.ipAddress = context.ipAddress ?? session.ipAddress;
      session.userAgent = context.userAgent?.slice(0, 500) ?? session.userAgent;
      await repository.save(session);
      return {
        reusedSession: null,
        user: session.user,
        tokens: {
          accessToken: await this.signAccess(session.user),
          refreshToken: nextRefreshToken,
        },
      };
    });
    if (result.reusedSession) {
      await this.sessions.createQueryBuilder()
        .update(UserSession)
        .set({ revokedAt: new Date() })
        .where('id = :id AND user_id = :userId AND revoked_at IS NULL', {
          id: result.reusedSession.id,
          userId: result.reusedSession.userId,
        })
        .execute();
      throw new UnauthorizedException('AUTH_REFRESH_TOKEN_REUSED');
    }
    return { tokens: result.tokens, user: result.user };
  }

  async revoke(refreshToken?: string | null): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.verifyRefresh(refreshToken);
      await this.sessions.createQueryBuilder()
        .update(UserSession)
        .set({ revokedAt: new Date() })
        .where('id = :id AND user_id = :userId AND revoked_at IS NULL', {
          id: payload.sid,
          userId: payload.sub,
        })
        .execute();
    } catch {
      // Logout must remain idempotent even when the cookie is expired or malformed.
    }
  }

  async revokeAll(userId: number): Promise<void> {
    await this.sessions.createQueryBuilder()
      .update(UserSession)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();
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

  private signRefresh(userId: number, sessionId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, sid: sessionId, jti: randomUUID(), type: 'refresh' } satisfies RefreshTokenPayload,
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
      if (payload.type !== 'refresh' || !payload.sid) throw new Error('wrong token type');
      return payload;
    } catch {
      throw new UnauthorizedException('AUTH_REFRESH_TOKEN_INVALID_OR_EXPIRED');
    }
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.config.getOrThrow<number>('AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS') * 1000);
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
