import { inject, Injectable } from '@angular/core';
import { ContentPost } from '../models/content.model';
import { PaginationMeta } from '../models/api.model';
import { ApiClientService, ApiQuery } from './api-client.service';

export interface PostTranslationPayload {
  languageId:number;
  title:string;
  content:string;
  isAutoTranslated:boolean;
}
export interface OwnerPostPayload {
  thumbnail:string;
  categoryId:number;
  sourceLanguageId:number;
  translations:PostTranslationPayload[];
}
export interface OwnerPostStats {
  total:number;
  DRAFT:number;
  PENDING:number;
  PUBLISHED:number;
  REJECTED:number;
}
export interface OwnerPostListData {
  items:ContentPost[];
  stats:OwnerPostStats;
  pagination:PaginationMeta;
}
export interface OwnerPostQuery extends ApiQuery {
  page:number;
  limit:number;
  status?:string;
  search?:string;
  sort?:string;
}

@Injectable({providedIn:'root'})
export class OwnerPostsApiService {
  private readonly api=inject(ApiClientService);
  list(query:OwnerPostQuery){return this.api.get<OwnerPostListData>('owner/posts',{query});}
  get(id:string){return this.api.get<{item:ContentPost}>(`owner/posts/${id}`);}
  create(payload:OwnerPostPayload){return this.api.post<{item:ContentPost}>('owner/posts',payload);}
  update(id:string,payload:OwnerPostPayload){return this.api.patch<{item:ContentPost}>(`owner/posts/${id}`,payload);}
  submit(id:string){return this.api.post<{item:ContentPost}>(`owner/posts/${id}/submit`,{});}
  delete(id:string){return this.api.delete<never>(`owner/posts/${id}`);}
}
