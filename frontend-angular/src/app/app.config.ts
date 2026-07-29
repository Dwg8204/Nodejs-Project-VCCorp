import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/http/api-error.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';
import { loadingInterceptor } from './core/http/loading.interceptor';
import { AuthRepository } from './data/contracts/auth.repository';
import { MockAuthRepository } from './data/mock/mock-auth.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loadingInterceptor,
        apiErrorInterceptor,
      ]),
    ),
    { provide: AuthRepository, useClass: MockAuthRepository },
  ],
};
