import { NotFoundException } from '@nestjs/common';
import { PostStatus } from 'common/enums/database.enums';
import { LikeService } from './likeService';

describe('LikeService', () => {
  const likeRepository = {
    findOne: jest.fn(), create: jest.fn((value) => ({ id: '1', ...value })),
    save: jest.fn(async (value) => value), count: jest.fn(),
  };
  const postRepository = { findOne: jest.fn() };
  const realtime = { publish: jest.fn() };
  let service: LikeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LikeService(likeRepository as never, postRepository as never, realtime as never);
  });

  it('trả false khi user chưa từng like bài', async () => {
    likeRepository.findOne.mockResolvedValue(null);
    await expect(service.getMyLike(7, '10')).resolves.toEqual({ success: true, data: { liked: false } });
  });

  it('tạo đúng một record ở lần like đầu tiên', async () => {
    postRepository.findOne.mockResolvedValue({ id: '10', status: PostStatus.Published });
    likeRepository.findOne.mockResolvedValue(null);
    likeRepository.count.mockResolvedValue(1);
    const result = await service.toggleLike(7, '10');
    expect(likeRepository.create).toHaveBeenCalledWith({ userId: 7, postId: '10', isLiked: true });
    expect(result.data).toEqual({ liked: true, totalLikes: 1 });
    expect(realtime.publish).toHaveBeenCalledWith('LIKE_CHANGED', '10');
  });

  it('tái sử dụng record hiện có và đảo trạng thái thay vì tạo thêm', async () => {
    const existing = { id: '3', userId: 7, postId: '10', isLiked: true };
    postRepository.findOne.mockResolvedValue({ id: '10', status: PostStatus.Published });
    likeRepository.findOne.mockResolvedValue(existing);
    likeRepository.count.mockResolvedValue(0);
    const result = await service.toggleLike(7, '10');
    expect(likeRepository.create).not.toHaveBeenCalled();
    expect(likeRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: '3', isLiked: false }));
    expect(result.message).toBe('POST_UNLIKED');
  });

  it('không cho like bài không tồn tại hoặc chưa published', async () => {
    postRepository.findOne.mockResolvedValue(null);
    await expect(service.toggleLike(7, '10')).rejects.toBeInstanceOf(NotFoundException);
    expect(likeRepository.save).not.toHaveBeenCalled();
  });
});
