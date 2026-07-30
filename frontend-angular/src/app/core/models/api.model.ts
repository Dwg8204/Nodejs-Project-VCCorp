export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorPayload {
  statusCode?: number;
  code?: string;
  message?: string | string[];
  error?: string;
}

export interface NormalizedApiError {
  status: number;
  code: string;
  messages: string[];
  originalError: unknown;
}
