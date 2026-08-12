import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/http/api-error.interceptor';
import { loadingInterceptor } from './core/http/loading.interceptor';
import { authRefreshInterceptor } from './core/http/auth-refresh.interceptor';
import { AuthService } from './core/services/auth.service';
import { AuthApiRepository } from './data/api/auth-api.repository';
import { AuthRepository } from './data/contracts/auth.repository';

function initializeAuth(auth: AuthService): () => Promise<void> {
  return () => firstValueFrom(auth.initializeSession());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        apiErrorInterceptor,
        authRefreshInterceptor,
      ]),
    ),
    { provide: AuthRepository, useClass: AuthApiRepository },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
};
