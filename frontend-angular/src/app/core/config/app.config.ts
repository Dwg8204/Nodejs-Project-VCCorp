export const APP_CONFIG = {
  appName: 'VCCorp Blog',
  defaultLocale: 'vi',
  supportedLocales: ['vi', 'en'] as const,
  defaultPageSize: 5,
  apiBaseUrl: 'http://localhost:3000/api',
} as const;

export type AppLocale = (typeof APP_CONFIG.supportedLocales)[number];
