import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostStatus } from 'common/enums/database.enums';
import { CommentService } from './commentService';

describe('CommentService', () => {
  const deleteBuilder = { softDelete: jest.fn(), where: jest.fn(), andWhere: jest.fn(), execute: jest.fn() };
  const comments = {
    findOne: jest.fn(), create: jest.fn((value) => ({ id: '99', ...value })),
    save: jest.fn(async (value) => value), softDelete: jest.fn(), createQueryBuilder: jest.fn(),
  };
  const posts = { findOne: jest.fn() };
  const realtime = { publish: jest.fn() };
  let service: CommentService;

  beforeEach(() => {
    jest.clearAllMocks();
    deleteBuilder.softDelete.mockReturnValue(deleteBuilder);
    deleteBuilder.where.mockReturnValue(deleteBuilder);
    deleteBuilder.andWhere.mockReturnValue(deleteBuilder);
    comments.createQueryBuilder.mockReturnValue(deleteBuilder);
    service = new CommentService(comments as never, posts as never, realtime as never);
  });

  it('không cho bình luận bài chưa published', async () => {
    posts.findOne.mockResolvedValue({ id: '1', status: PostStatus.Pending });
    await expect(service.create(1, '1', { content: 'hello' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reply người khác được quy về root và tự thêm mention', async () => {
    posts.findOne.mockResolvedValue({ id: '1', status: PostStatus.Published });
    comments.findOne.mockResolvedValue({ id: '8', parentId: '3', userId: 2, user: { userName: 'nguyenb' } });
    const result = await service.create(1, '1', { content: 'xin chào', parentId: '8' });
    expect(comments.create).toHaveBeenCalledWith(expect.objectContaining({ parentId: '3', content: '@nguyenb xin chào' }));
    expect(result.message).toBe('COMMENT_CREATED');
  });

  it('reply chính mình không tự tag tên', async () => {
    posts.findOne.mockResolvedValue({ id: '1', status: PostStatus.Published });
    comments.findOne.mockResolvedValue({ id: '8', parentId: null, userId: 1, user: { userName: 'nguyena' } });
    await service.create(1, '1', { content: '@nguyena bổ sung', parentId: '8' });
    expect(comments.create).toHaveBeenCalledWith(expect.objectContaining({ parentId: '8', content: 'bổ sung' }));
  });

  it('chỉ chủ bình luận mới được xóa', async () => {
    comments.findOne.mockResolvedValue({ id: '8', userId: 2, parentId: null });
    await expect(service.remove(1, '1', '8')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('xóa root đồng thời xóa mềm toàn bộ reply và trả đúng số lượng', async () => {
    comments.findOne.mockResolvedValue({ id: '8', userId: 1, parentId: null });
    deleteBuilder.execute.mockResolvedValue({ affected: 4 });
    const result = await service.remove(1, '1', '8');
    expect(deleteBuilder.andWhere).toHaveBeenCalledWith('(id = :commentId OR parent_id = :commentId)', { commentId: '8' });
    expect(result.data.deletedCount).toBe(4);
    expect(realtime.publish).toHaveBeenCalledWith('COMMENT_DELETED', '1');
  });

  it('xóa reply chỉ xóa chính reply đó', async () => {
    comments.findOne.mockResolvedValue({ id: '9', userId: 1, parentId: '8' });
    comments.softDelete.mockResolvedValue({ affected: 1 });
    const result = await service.remove(1, '1', '9');
    expect(comments.softDelete).toHaveBeenCalledWith('9');
    expect(deleteBuilder.execute).not.toHaveBeenCalled();
    expect(result.data.deletedCount).toBe(1);
  });

  it('báo not found khi comment không tồn tại', async () => {
    comments.findOne.mockResolvedValue(null);
    await expect(service.remove(1, '1', '8')).rejects.toBeInstanceOf(NotFoundException);
  });
});
