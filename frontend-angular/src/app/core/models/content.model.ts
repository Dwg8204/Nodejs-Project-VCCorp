import { PaginatedData } from './api.model';

export interface ContentTranslation {
  id: string;
  languageId: number;
  title?: string;
  content?: string;
  name?: string;
  des?: string | null;
  isAutoTranslated: boolean;
}

export interface ContentAuthor {
  id: number;
  fullName: string | null;
  userName: string;
  avatar: string | null;
}

export interface ContentCategory {
  id: number;
  sourceLanguageId: number | null;
  translations: ContentTranslation[];
  postsCount?: number;
}

export interface ContentPost {
  id: string;
  authorId: number;
  categoryId: number;
  sourceLanguageId: number | null;
  thumbnail: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  rejectionReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  translations: ContentTranslation[];
  category: ContentCategory;
  author: ContentAuthor | null;
  likesCount: number;
  commentsCount: number;
}

export interface ContentComment {
  id: string;
  postId: string;
  userId: number;
  parentId: string | null;
  content: string;
  createdAt: string;
  user: Pick<ContentAuthor, 'id' | 'fullName' | 'avatar'> | null;
}

export type ContentPage<T> = PaginatedData<T>;
