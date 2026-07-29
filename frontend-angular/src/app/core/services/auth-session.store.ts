import { Injectable, signal } from '@angular/core';
import { User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthSessionStore {
  private readonly userState = signal<User | null>(null);

  readonly user = this.userState.asReadonly();

  setUser(user: User): void {
    this.userState.set(user);
  }

  clear(): void {
    this.userState.set(null);
  }
}
