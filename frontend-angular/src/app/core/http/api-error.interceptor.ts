import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ApiErrorService } from '../services/api-error.service';
import { AUTH_STORAGE_KEYS } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { SKIP_AUTH_REDIRECT } from './http-context.tokens';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const errors = inject(ApiErrorService);
  const storage = inject(StorageService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      errors.publish(error);

      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.context.get(SKIP_AUTH_REDIRECT)
      ) {
        storage.remove(AUTH_STORAGE_KEYS.token);
        storage.remove(AUTH_STORAGE_KEYS.user);
        void router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      }

      return throwError(() => error);
    }),
  );
};
