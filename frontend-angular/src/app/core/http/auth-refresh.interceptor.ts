import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthSessionStore } from '../services/auth-session.store';
import { AuthRefreshService } from '../services/auth-refresh.service';
import { SKIP_AUTH_REFRESH } from './http-context.tokens';

export const authRefreshInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_AUTH_REFRESH) || request.url.includes('/auth/refresh')) {
    return next(request);
  }
  const refresh = inject(AuthRefreshService);
  const session = inject(AuthSessionStore);
  const router = inject(Router);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return refresh.refresh().pipe(
        switchMap(() => next(request)),
        catchError((refreshError: unknown) => {
          session.clear();
          void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
