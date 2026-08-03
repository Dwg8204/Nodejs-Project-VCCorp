import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import {
  ContentCategory,
  ContentComment,
  ContentPage,
  ContentPost,
} from '../models/content.model';
import { ApiClientService, ApiQuery } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class ContentApiService {
  private readonly api = inject(ApiClientService);

  categories(query: ApiQuery = {}): Observable<ApiResponse<ContentPage<ContentCategory>>> {
    return this.api.get('categories', { query });
  }

  posts(query: ApiQuery = {}): Observable<ApiResponse<ContentPage<ContentPost>>> {
    return this.api.get('posts', { query });
  }

  post(id: string): Observable<ApiResponse<{ item: ContentPost }>> {
    return this.api.get(`posts/${id}`);
  }

  ownerPost(id: string): Observable<ApiResponse<{ item: ContentPost }>> {
    return this.api.get(`owner/posts/${id}`);
  }

  adminPost(id: string): Observable<ApiResponse<{ item: ContentPost }>> {
    return this.api.get(`admin/posts/${id}`);
  }

  comments(postId: string, query: ApiQuery = {}): Observable<ApiResponse<ContentPage<ContentComment>>> {
    return this.api.get(`posts/${postId}/comments`, { query });
  }

  createComment(postId: string, content: string, parentId: string | null) {
    return this.api.post<{ item: ContentComment }>(`posts/${postId}/comments`, {
      content,
      ...(parentId ? { parentId } : {}),
    });
  }

  deleteComment(postId: string, commentId: string) {
    return this.api.delete<{ deletedCount: number }>(
      `posts/${postId}/comments/${commentId}`,
    );
  }

  myLike(postId: string): Observable<ApiResponse<{ liked: boolean }>> {
    return this.api.get(`posts/${postId}/likes/me`);
  }

  toggleLike(postId: string): Observable<ApiResponse<{ liked: boolean; totalLikes: number }>> {
    return this.api.post(`posts/${postId}/likes`, {});
  }
}
