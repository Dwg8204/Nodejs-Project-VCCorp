import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

import {
  ApiErrorPayload,
  NormalizedApiError,
} from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly latestErrorState = signal<NormalizedApiError | null>(null);

  readonly latestError = this.latestErrorState.asReadonly();

  normalize(error: unknown): NormalizedApiError {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        status: 0,
        code: 'CLIENT_ERROR',
        messages: [
          error instanceof Error ? error.message : 'An unexpected error occurred.',
        ],
        originalError: error,
      };
    }

    const payload = this.readPayload(error.error);
    const rawMessages = payload?.message ?? error.message;
    const messages = Array.isArray(rawMessages)
      ? rawMessages
      : [rawMessages || this.defaultMessage(error.status)];

    return {
      status: error.status,
      code: this.resolveCode(payload, error.status),
      messages,
      originalError: error,
    };
  }

  publish(error: unknown): NormalizedApiError {
    const normalized = this.normalize(error);
    this.latestErrorState.set(normalized);
    return normalized;
  }

  clear(): void {
    this.latestErrorState.set(null);
  }

  private readPayload(value: unknown): ApiErrorPayload | null {
    if (!value || typeof value !== 'object') return null;
    return value as ApiErrorPayload;
  }

  private resolveCode(
    payload: ApiErrorPayload | null,
    status: number,
  ): string {
    const message = payload?.message;
    if (typeof message === 'string' && /^[A-Z][A-Z0-9_]+$/.test(message)) {
      return message;
    }
    return `HTTP_${status || 0}`;
  }

  private defaultMessage(status: number): string {
    const messages: Record<number, string> = {
      0: 'Unable to connect to the server.',
      400: 'The submitted data is invalid.',
      401: 'Your session has expired.',
      403: 'You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'The request conflicts with existing data.',
      429: 'Too many requests. Please try again later.',
      500: 'The server encountered an error.',
    };
    return messages[status] ?? 'The request could not be completed.';
  }
}
