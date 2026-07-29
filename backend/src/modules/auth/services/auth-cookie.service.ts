import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';

@Injectable()
export class AuthCookieService {
  constructor(private readonly config: ConfigService) {}

  set(response: Response, accessToken: string): void {
    response.cookie(this.name, accessToken, {
      ...this.options,
      maxAge:
        this.config.getOrThrow<number>('AUTH_COOKIE_MAX_AGE_SECONDS') * 1_000,
    });
  }

  clear(response: Response): void {
    response.clearCookie(this.name, this.options);
  }

  private get name(): string {
    return this.config.getOrThrow<string>('AUTH_COOKIE_NAME');
  }

  private get options(): CookieOptions {
    const domain =
      this.config.getOrThrow<string>('AUTH_COOKIE_DOMAIN') || undefined;
    return {
      httpOnly: true,
      secure: this.config.getOrThrow<boolean>('AUTH_COOKIE_SECURE'),
      sameSite:
        this.config.getOrThrow<'lax' | 'strict' | 'none'>(
          'AUTH_COOKIE_SAME_SITE',
        ),
      path: '/',
      domain,
    };
  }
}
