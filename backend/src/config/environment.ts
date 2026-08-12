export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_LOGGING: boolean;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  AUTH_COOKIE_NAME: string;
  AUTH_COOKIE_MAX_AGE_SECONDS: number;
  AUTH_REFRESH_COOKIE_NAME: string;
  AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS: number;
  AUTH_COOKIE_SECURE: boolean;
  AUTH_COOKIE_SAME_SITE: 'lax' | 'strict' | 'none';
  AUTH_COOKIE_DOMAIN: string;
  BCRYPT_SALT_ROUNDS: number;
  OTP_EXPIRES_IN_SECONDS: number;
  OTP_MAX_ATTEMPTS: number;
  OTP_RESEND_COOLDOWN_SECONDS: number;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_APP_PASSWORD: string;
  SMTP_FROM: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_FOLDER: string;
  REDIS_ENABLED:boolean;
  REDIS_HOST:string;
  REDIS_PORT:number;
  REDIS_PASSWORD:string;
  REDIS_DB:number;
  REDIS_KEY_PREFIX:string;
}

function parseInteger(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} phải là số nguyên dương`);
  }
  return parsed;
}

export function validateEnvironment(
  raw: Record<string, unknown>,
): EnvironmentVariables {
  const value = raw as Record<string, string | undefined>;
  const jwtSecret = value.JWT_SECRET?.trim();
  const refreshSecret = value.JWT_REFRESH_SECRET?.trim();
  const cookieSameSite = value.AUTH_COOKIE_SAME_SITE ?? 'lax';

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET phải có ít nhất 32 ký tự');
  }
  if (!refreshSecret || refreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET phải có ít nhất 32 ký tự');
  }
  if (refreshSecret === jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET phải khác JWT_SECRET');
  }
  if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
    throw new Error('AUTH_COOKIE_SAME_SITE phải là lax, strict hoặc none');
  }

  return {
    NODE_ENV: value.NODE_ENV ?? 'development',
    PORT: parseInteger(value.PORT, 3000, 'PORT'),
    CORS_ORIGIN: value.CORS_ORIGIN ?? 'http://localhost:4200',
    DB_HOST: value.DB_HOST ?? '127.0.0.1',
    DB_PORT: parseInteger(value.DB_PORT, 3306, 'DB_PORT'),
    DB_USER: value.DB_USER ?? 'root',
    DB_PASSWORD: value.DB_PASSWORD ?? '',
    DB_NAME: value.DB_NAME ?? 'vccorp_db',
    DB_LOGGING: value.DB_LOGGING === 'true',
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: value.JWT_EXPIRES_IN ?? '15m',
    JWT_REFRESH_SECRET: refreshSecret,
    JWT_REFRESH_EXPIRES_IN: value.JWT_REFRESH_EXPIRES_IN ?? '7d',
    AUTH_COOKIE_NAME: value.AUTH_COOKIE_NAME ?? 'vccorp_access_token',
    AUTH_COOKIE_MAX_AGE_SECONDS: parseInteger(
      value.AUTH_COOKIE_MAX_AGE_SECONDS,
      900,
      'AUTH_COOKIE_MAX_AGE_SECONDS',
    ),
    AUTH_REFRESH_COOKIE_NAME:
      value.AUTH_REFRESH_COOKIE_NAME ?? 'vccorp_refresh_token',
    AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS: parseInteger(
      value.AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS,
      604800,
      'AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS',
    ),
    AUTH_COOKIE_SECURE: value.AUTH_COOKIE_SECURE === 'true',
    AUTH_COOKIE_SAME_SITE: cookieSameSite as 'lax' | 'strict' | 'none',
    AUTH_COOKIE_DOMAIN: value.AUTH_COOKIE_DOMAIN?.trim() ?? '',
    BCRYPT_SALT_ROUNDS: parseInteger(
      value.BCRYPT_SALT_ROUNDS,
      10,
      'BCRYPT_SALT_ROUNDS',
    ),
    OTP_EXPIRES_IN_SECONDS: parseInteger(
      value.OTP_EXPIRES_IN_SECONDS,
      180,
      'OTP_EXPIRES_IN_SECONDS',
    ),
    OTP_MAX_ATTEMPTS: parseInteger(
      value.OTP_MAX_ATTEMPTS,
      5,
      'OTP_MAX_ATTEMPTS',
    ),
    OTP_RESEND_COOLDOWN_SECONDS: parseInteger(
      value.OTP_RESEND_COOLDOWN_SECONDS,
      60,
      'OTP_RESEND_COOLDOWN_SECONDS',
    ),
    SMTP_HOST: value.SMTP_HOST ?? 'smtp.gmail.com',
    SMTP_PORT: parseInteger(value.SMTP_PORT, 465, 'SMTP_PORT'),
    SMTP_SECURE: value.SMTP_SECURE !== 'false',
    SMTP_USER: value.SMTP_USER?.trim() ?? '',
    SMTP_APP_PASSWORD: value.SMTP_APP_PASSWORD?.replace(/\s+/g, '') ?? '',
    SMTP_FROM: value.SMTP_FROM?.trim() ?? value.SMTP_USER?.trim() ?? '',
    CLOUDINARY_CLOUD_NAME: value.CLOUDINARY_CLOUD_NAME?.trim() ?? '',
    CLOUDINARY_API_KEY: value.CLOUDINARY_API_KEY?.trim() ?? '',
    CLOUDINARY_API_SECRET: value.CLOUDINARY_API_SECRET?.trim() ?? '',
    CLOUDINARY_FOLDER: value.CLOUDINARY_FOLDER?.trim() ?? 'vccorp-blog',
    REDIS_ENABLED:value.REDIS_ENABLED==='true',
    REDIS_HOST:value.REDIS_HOST?.trim()??'127.0.0.1',
    REDIS_PORT:parseInteger(value.REDIS_PORT,6379,'REDIS_PORT'),
    REDIS_PASSWORD:value.REDIS_PASSWORD??'',
    REDIS_DB:Number(value.REDIS_DB??0),
    REDIS_KEY_PREFIX:value.REDIS_KEY_PREFIX?.trim()??'vccorp:',
  };
}
