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
  BCRYPT_SALT_ROUNDS: number;
  OTP_EXPIRES_IN_SECONDS: number;
  OTP_MAX_ATTEMPTS: number;
  OTP_RESEND_COOLDOWN_SECONDS: number;
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

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET phải có ít nhất 32 ký tự');
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
    JWT_EXPIRES_IN: value.JWT_EXPIRES_IN ?? '1h',
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
  };
}
