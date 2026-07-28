const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'passwordchangedat',
  'otp',
  'otpcode',
  'otpcodehash',
  'otphash',
  'resettoken',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'jwt',
  'secret',
  'cookie',
]);

const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 100;
const MAX_STRING_LENGTH = 5_000;

function normalizeKey(key: string): string {
  return key.replace(/[_\-\s]/g, '').toLowerCase();
}

export function sanitizeAuditData(
  value: unknown,
  depth = 0,
): unknown {
  if (value === null || value === undefined) return value;
  if (depth >= MAX_DEPTH) return '[MAX_DEPTH_REACHED]';
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}[TRUNCATED]`
      : value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeAuditData(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.has(normalizeKey(key))
        ? '[REDACTED]'
        : sanitizeAuditData(item, depth + 1),
    ]),
  );
}
