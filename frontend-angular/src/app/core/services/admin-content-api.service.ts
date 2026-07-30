import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '../models/api.model';
import { ContentCategory, ContentPage, ContentPost } from '../models/content.model';
import { ApiClientService, ApiQuery } from './api-client.service';

export interface CategoryTranslationPayload {
  languageId: number;
  name: string;
  des?: string;
  isAutoTranslated?: boolean;
}

export interface CategoryPayload {
  sourceLanguageId: number;
  translations: CategoryTranslationPayload[];
}

export interface AdminPostsPage extends ContentPage<ContentPost> {
  stats: {
    total: number;
    DRAFT: number;
    PENDING: number;
    PUBLISHED: number;
    REJECTED: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminContentApiService {
  private readonly api=inject(ApiClientService);

  posts(query:ApiQuery={}){return this.api.get<AdminPostsPage>('admin/posts',{query});}
  approve(id:string){return this.api.post<{item:ContentPost}>(`admin/posts/${id}/approve`,{});}
  reject(id:string,reason:string){return this.api.post<{item:ContentPost}>(`admin/posts/${id}/reject`,{reason});}

  categories(query:ApiQuery={}){return this.api.get<ContentPage<ContentCategory>>('admin/categories',{query});}
  createCategory(payload:CategoryPayload){return this.api.post<{item:ContentCategory}>('admin/categories',payload);}
  updateCategory(id:number,payload:CategoryPayload){return this.api.put<{item:ContentCategory}>(`admin/categories/${id}`,payload);}
  deleteCategory(id:number){return this.api.delete<null>(`admin/categories/${id}`);}
}
