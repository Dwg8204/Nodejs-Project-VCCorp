import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, Observable, shareReplay } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/api.model';
import { SKIP_AUTH_REDIRECT, SKIP_AUTH_REFRESH } from '../http/http-context.tokens';

@Injectable({ providedIn: 'root' })
export class AuthRefreshService {
  private readonly http = inject(HttpClient);
  private activeRequest?: Observable<ApiResponse<null>>;

  refresh(): Observable<ApiResponse<null>> {
    if (!this.activeRequest) {
      const context = new HttpContext()
        .set(SKIP_AUTH_REFRESH, true)
        .set(SKIP_AUTH_REDIRECT, true);
      this.activeRequest = this.http.post<ApiResponse<null>>(
        `${APP_CONFIG.apiBaseUrl}/auth/refresh`,
        {},
        { context, withCredentials: true },
      ).pipe(
        finalize(() => { this.activeRequest = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.activeRequest;
  }
}
