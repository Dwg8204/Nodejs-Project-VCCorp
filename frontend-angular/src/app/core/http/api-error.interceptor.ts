import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ApiErrorService } from '../services/api-error.service';
import { AuthSessionStore } from '../services/auth-session.store';
import { SKIP_AUTH_REDIRECT } from './http-context.tokens';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const errors = inject(ApiErrorService);
  const session = inject(AuthSessionStore);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      const normalized = errors.publish(error);

      if (
        error instanceof HttpErrorResponse &&
        (error.status === 401 || normalized.code === 'AUTH_ACCOUNT_LOCKED') &&
        !request.context.get(SKIP_AUTH_REDIRECT)
      ) {
        session.clear();
        void router.navigate(['/login'], {
          queryParams: { returnUrl: router.url },
        });
      }

      return throwError(() => error);
    }),
  );
};
