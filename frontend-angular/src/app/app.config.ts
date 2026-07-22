import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthRepository } from './data/contracts/auth.repository';
import { MockAuthRepository } from './data/mock/mock-auth.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: AuthRepository, useClass: MockAuthRepository },
  ],
};
