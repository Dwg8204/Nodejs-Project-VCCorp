import { HttpContextToken } from '@angular/common/http';

export const SKIP_AUTH_TOKEN = new HttpContextToken<boolean>(() => false);
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);
export const SKIP_GLOBAL_LOADING = new HttpContextToken<boolean>(() => false);
