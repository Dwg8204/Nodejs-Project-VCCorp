export const APP_CONFIG = {
  appName: 'VCCorp Blog',
  defaultLocale: 'vi',
  defaultPageSize: 5,
  apiBaseUrl: 'http://localhost:3000/api',
} as const;

export type AppLocale = string;
