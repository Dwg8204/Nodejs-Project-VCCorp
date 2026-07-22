export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorPayload {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
