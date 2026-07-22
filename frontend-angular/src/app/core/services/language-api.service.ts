import { inject, Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';

import { MockDatabaseService } from '../../data/mock/mock-database.service';
import { LanguageRow } from '../../data/mock/mock-schema.model';
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
  private readonly database = inject(MockDatabaseService);

  list(query: PaginationQuery): Observable<ApiResponse<LanguageListData>> {
    const search = query.search?.trim().toLocaleLowerCase() ?? '';
    const filtered = this.database.table('languages')
      .filter((row) => !row.deleted_at)
      .filter((row) => !search || row.code.toLowerCase().includes(search) || row.name.toLocaleLowerCase().includes(search));
    const start = (query.page - 1) * query.limit;
    const data = {
      languages: filtered.slice(start, start + query.limit).map((row) => this.map(row)),
      total: filtered.length, page: query.page, limit: query.limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / query.limit)),
    };
    return of({ success: true, message: 'Lấy danh sách ngôn ngữ thành công', data }).pipe(delay(250));
  }

  getById(id: number): Observable<ApiResponse<{ language: Language }>> {
    const row = this.database.table('languages').find((item) => item.id === id && !item.deleted_at);
    return row
      ? of({ success: true, message: 'Lấy ngôn ngữ thành công', data: { language: this.map(row) } }).pipe(delay(200))
      : throwError(() => new Error('Không tìm thấy ngôn ngữ.'));
  }

  create(payload: LanguagePayload): Observable<ApiResponse<{ language: Language }>> {
    const rows = this.database.table('languages');
    if (rows.some((row) => row.code.toLowerCase() === payload.code.trim().toLowerCase())) {
      return throwError(() => new Error('Mã ngôn ngữ đã tồn tại.'));
    }
    const timestamp = new Date().toISOString();
    const row: LanguageRow = { id: this.database.nextId('languages'), code: payload.code.trim().toLowerCase(), name: payload.name.trim(), flag: payload.flag ?? null, created_at: timestamp, updated_at: timestamp, deleted_at: null };
    rows.push(row);
    this.database.write('languages', rows);
    return of({ success: true, message: 'Tạo ngôn ngữ thành công', data: { language: this.map(row) } }).pipe(delay(250));
  }

  update(id: number, payload: Partial<LanguagePayload>): Observable<ApiResponse<{ language: Language }>> {
    const rows = this.database.table('languages');
    const row = rows.find((item) => item.id === id);
    if (!row) return throwError(() => new Error('Không tìm thấy ngôn ngữ.'));
    if (payload.code !== undefined) row.code = payload.code.trim().toLowerCase();
    if (payload.name !== undefined) row.name = payload.name.trim();
    if (payload.flag !== undefined) row.flag = payload.flag;
    row.updated_at = new Date().toISOString();
    this.database.write('languages', rows);
    return of({ success: true, message: 'Cập nhật ngôn ngữ thành công', data: { language: this.map(row) } }).pipe(delay(250));
  }

  remove(id: number): Observable<ApiResponse<unknown>> {
    const rows = this.database.table('languages');
    const row = rows.find((item) => item.id === id);
    if (!row) return throwError(() => new Error('Không tìm thấy ngôn ngữ.'));
    row.deleted_at = new Date().toISOString();
    this.database.write('languages', rows);
    return of({ success: true, message: 'Xóa ngôn ngữ thành công', data: null }).pipe(delay(250));
  }

  restore(id: number): Observable<ApiResponse<{ language: Language }>> {
    const rows = this.database.table('languages');
    const row = rows.find((item) => item.id === id);
    if (!row) return throwError(() => new Error('Không tìm thấy ngôn ngữ.'));
    row.deleted_at = null;
    row.updated_at = new Date().toISOString();
    this.database.write('languages', rows);
    return of({ success: true, message: 'Khôi phục ngôn ngữ thành công', data: { language: this.map(row) } }).pipe(delay(250));
  }

  private map(row: LanguageRow): Language {
    return { id: row.id, code: row.code, name: row.name, flag: row.flag, createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at };
  }
}
