import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { APP_CONFIG } from '../config/app.config';
import { AUTH_STORAGE_KEYS } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { SKIP_AUTH_TOKEN } from './http-context.tokens';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const storage = inject(StorageService);
  const token = storage.get<string>(AUTH_STORAGE_KEYS.token);
  const isBackendRequest = request.url.startsWith(APP_CONFIG.apiBaseUrl);
  const shouldAttachToken =
    token && isBackendRequest && !request.context.get(SKIP_AUTH_TOKEN);

  const authenticatedRequest = shouldAttachToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest);
};
