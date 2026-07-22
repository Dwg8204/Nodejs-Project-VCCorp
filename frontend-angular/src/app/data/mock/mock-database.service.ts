import { inject, Injectable } from '@angular/core';

import { StorageService } from '../../core/services/storage.service';
import { MOCK_DATABASE_SEED } from './mock.seed';
import { MockDatabase, MockTableName } from './mock-schema.model';

const DATABASE_KEY = 'vccorp_angular_mock_database_v1';
const CREDENTIALS_KEY = 'vccorp_angular_mock_credentials_v1';

@Injectable({ providedIn: 'root' })
export class MockDatabaseService {
  private readonly storage = inject(StorageService);

  constructor() {
    if (!this.storage.get<MockDatabase>(DATABASE_KEY)) this.reset();
  }

  table<K extends MockTableName>(name: K): MockDatabase[K] {
    return structuredClone(this.read()[name]);
  }

  write<K extends MockTableName>(name: K, rows: MockDatabase[K]): void {
    const database = this.read();
    database[name] = structuredClone(rows) as MockDatabase[K];
    this.storage.set(DATABASE_KEY, database);
  }

  nextId<K extends MockTableName>(name: K): number {
    const rows = this.table(name) as Array<{ id?: number }>;
    return rows.reduce((maximum, row) => Math.max(maximum, row.id ?? 0), 0) + 1;
  }

  getRegisteredPassword(email: string): string | null {
    const credentials = this.storage.get<Record<string, string>>(CREDENTIALS_KEY) ?? {};
    return credentials[email.toLowerCase()] ?? null;
  }

  setRegisteredPassword(email: string, password: string): void {
    const credentials = this.storage.get<Record<string, string>>(CREDENTIALS_KEY) ?? {};
    credentials[email.toLowerCase()] = password;
    this.storage.set(CREDENTIALS_KEY, credentials);
  }

  reset(): void {
    this.storage.set(DATABASE_KEY, structuredClone(MOCK_DATABASE_SEED));
    this.storage.set(CREDENTIALS_KEY, {});
  }

  private read(): MockDatabase {
    return this.storage.get<MockDatabase>(DATABASE_KEY) ?? structuredClone(MOCK_DATABASE_SEED);
  }
}
