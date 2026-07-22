import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly document = inject(DOCUMENT);

  private get storage(): Storage | null {
    try {
      return this.document.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }

  get<T>(key: string): T | null {
    const value = this.storage?.getItem(key);
    if (value === null || value === undefined) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  set<T>(key: string, value: T): void {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.storage?.setItem(key, serialized);
  }

  remove(key: string): void {
    this.storage?.removeItem(key);
  }
}
