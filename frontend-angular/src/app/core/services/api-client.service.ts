import {
  HttpClient,
  HttpContext,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_CONFIG } from '../config/app.config';
import { ApiResponse } from '../models/api.model';

type QueryValue = string | number | boolean | null | undefined;
export type ApiQuery = Record<string, QueryValue>;

export interface ApiRequestOptions {
  context?: HttpContext;
  query?: ApiQuery;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);

  get<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.url(path), {
      context: options.context,
      params: this.params(options.query),
      withCredentials: true,
    });
  }

  post<T>(
    path: string,
    body: unknown,
    options: ApiRequestOptions = {},
  ): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url(path), body, {
      context: options.context,
      params: this.params(options.query),
      withCredentials: true,
    });
  }

  patch<T>(
    path: string,
    body: unknown,
    options: ApiRequestOptions = {},
  ): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.url(path), body, {
      context: options.context,
      params: this.params(options.query),
      withCredentials: true,
    });
  }

  delete<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.url(path), {
      context: options.context,
      params: this.params(options.query),
      withCredentials: true,
    });
  }

  private url(path: string): string {
    return `${APP_CONFIG.apiBaseUrl}/${path.replace(/^\/+/, '')}`;
  }

  private params(query?: ApiQuery): HttpParams {
    let params = new HttpParams();
    if (!query) return params;

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
