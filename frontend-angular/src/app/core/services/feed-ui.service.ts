import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FeedUiService {
  readonly searchQuery = signal('');
}
