import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, PaginatedData } from '../models/api.model';
import { ApiClientService } from './api-client.service';

export type LanguageTranslationStatus = 'DRAFT' | 'TRANSLATING' | 'READY' | 'FAILED' | 'DISABLED';
export type LanguageRecordFilter = 'active' | 'deleted' | 'all';
export type LanguageSort = 'newest' | 'oldest' | 'a-z' | 'z-a';

export interface AdminLanguage {
  id: number;
  code: string;
  name: string;
  flag: string | null;
  isActive: boolean;
  isSystemLanguage: boolean;
  fallbackLanguageId: number | null;
  fallbackLanguage: { id: number; code: string; name: string } | null;
  translationStatus: LanguageTranslationStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLanguagesQuery {
  page: number;
  limit: number;
  search?: string;
  translationStatus?: LanguageTranslationStatus;
  isActive?: boolean;
  records?: LanguageRecordFilter;
  sort?: LanguageSort;
}

export interface LanguagePayload {
  code: string;
  name: string;
  flag?: string | null;
  fallbackLanguageId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class LanguageApiService {
  private readonly api = inject(ApiClientService);

  list(query: AdminLanguagesQuery): Observable<ApiResponse<PaginatedData<AdminLanguage>>> {
    return this.api.get<PaginatedData<AdminLanguage>>('admin/languages', {
      query: { ...query },
    });
  }

  create(
    payload: LanguagePayload & {
      isActive: boolean;
      translationStatus: LanguageTranslationStatus;
    },
  ): Observable<ApiResponse<{ language: AdminLanguage }>> {
    return this.api.post<{ language: AdminLanguage }>('admin/languages', payload);
  }

  update(
    id: number,
    payload: LanguagePayload,
  ): Observable<ApiResponse<{ language: AdminLanguage }>> {
    return this.api.patch<{ language: AdminLanguage }>(
      `admin/languages/${id}`,
      payload,
    );
  }

  changeStatus(
    id: number,
    isActive: boolean,
    translationStatus: LanguageTranslationStatus,
  ): Observable<ApiResponse<{ language: AdminLanguage }>> {
    return this.api.patch<{ language: AdminLanguage }>(
      `admin/languages/${id}/status`,
      { isActive, translationStatus },
    );
  }

  remove(id: number): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`admin/languages/${id}`);
  }

  restore(id: number): Observable<ApiResponse<{ language: AdminLanguage }>> {
    return this.api.patch<{ language: AdminLanguage }>(
      `admin/languages/${id}/restore`,
      {},
    );
  }
}
