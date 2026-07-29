import { environment } from '../../../environments/environment';

export const APP_CONFIG = {
  appName: 'VCCorp Blog',
  defaultLocale: 'vi',
  defaultPageSize: 5,
  apiBaseUrl: environment.apiBaseUrl.replace(/\/+$/, ''),
} as const;

export type AppLocale = string;
