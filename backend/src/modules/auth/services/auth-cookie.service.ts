import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  set(response: Response, accessToken: string, refreshToken: string): void {
    response.cookie(this.accessName, accessToken, {
      ...this.options('/'),
      maxAge:
        this.config.getOrThrow<number>('AUTH_COOKIE_MAX_AGE_SECONDS') * 1_000,
    });
    response.cookie(this.refreshName, refreshToken, {
      ...this.options('/api/auth'),
      maxAge:
        this.config.getOrThrow<number>('AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS') * 1_000,
    });
  }

  clear(response: Response): void {
    response.clearCookie(this.accessName, this.options('/'));
    response.clearCookie(this.refreshName, this.options('/api/auth'));
  }

  readRefresh(cookieHeader?: string): string | null {
    return this.read(cookieHeader, this.refreshName);
  }

  private get accessName(): string {
    return this.config.getOrThrow<string>('AUTH_COOKIE_NAME');
  }

  private get refreshName(): string {
    return this.config.getOrThrow<string>('AUTH_REFRESH_COOKIE_NAME');
  }

  private options(path: string): CookieOptions {
    const domain =
      this.config.getOrThrow<string>('AUTH_COOKIE_DOMAIN') || undefined;
    return {
      httpOnly: true,
      secure: this.config.getOrThrow<boolean>('AUTH_COOKIE_SECURE'),
      sameSite:
        this.config.getOrThrow<'lax' | 'strict' | 'none'>(
          'AUTH_COOKIE_SAME_SITE',
        ),
      path,
      domain,
    };
  }

  private read(header: string | undefined, name: string): string | null {
    if (!header) return null;
    for (const entry of header.split(';')) {
      const separator = entry.indexOf('=');
      if (separator < 0 || entry.slice(0, separator).trim() !== name) continue;
      const value = entry.slice(separator + 1).trim();
      try { return decodeURIComponent(value); } catch { return value; }
    }
    return null;
  }
}
