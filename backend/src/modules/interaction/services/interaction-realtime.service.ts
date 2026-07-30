import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface InteractionChangedEvent {
  type: 'LIKE_CHANGED' | 'COMMENT_CREATED';
  postId: string;
  occurredAt: string;
}

@Injectable()
export class InteractionRealtimeService {
  private readonly changes = new Subject<InteractionChangedEvent>();

  publish(type: InteractionChangedEvent['type'], postId: string): void {
    this.changes.next({ type, postId, occurredAt: new Date().toISOString() });
  }

  stream(): Observable<InteractionChangedEvent> {
    return this.changes.asObservable();
  }
}
