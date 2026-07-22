import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_CONFIG } from '../config/app.config';
import { ApiResponse, PaginationQuery } from '../models/api.model';
import { Language } from '../models/language.model';

export interface LanguageListData {
  languages: Language[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LanguagePayload {
  code: string;
  name: string;
  flag?: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${APP_CONFIG.apiBaseUrl}/languages`;

  list(query: PaginationQuery): Observable<ApiResponse<LanguageListData>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit);

    if (query.search?.trim()) params = params.set('search', query.search.trim());
    return this.http.get<ApiResponse<LanguageListData>>(this.endpoint, { params });
  }

  getById(id: number): Observable<ApiResponse<{ language: Language }>> {
    return this.http.get<ApiResponse<{ language: Language }>>(`${this.endpoint}/${id}`);
  }

  create(payload: LanguagePayload): Observable<ApiResponse<{ language: Language }>> {
    return this.http.post<ApiResponse<{ language: Language }>>(this.endpoint, payload);
  }

  update(id: number, payload: Partial<LanguagePayload>): Observable<ApiResponse<{ language: Language }>> {
    return this.http.put<ApiResponse<{ language: Language }>>(`${this.endpoint}/${id}`, payload);
  }

  remove(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.endpoint}/${id}`);
  }

  restore(id: number): Observable<ApiResponse<{ language: Language }>> {
    return this.http.patch<ApiResponse<{ language: Language }>>(`${this.endpoint}/${id}/restore`, {});
  }
}
