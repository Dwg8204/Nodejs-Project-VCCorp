import { firstValueFrom, take } from 'rxjs';
import { InteractionRealtimeService } from './interaction-realtime.service';

describe('InteractionRealtimeService', () => {
  it('phát event chứa type, postId và thời điểm hợp lệ', async () => {
    const service = new InteractionRealtimeService();
    const eventPromise = firstValueFrom(service.stream().pipe(take(1)));
    service.publish('COMMENT_DELETED', '42');
    await expect(eventPromise).resolves.toEqual(expect.objectContaining({ type: 'COMMENT_DELETED', postId: '42', occurredAt: expect.any(String) }));
  });
});
