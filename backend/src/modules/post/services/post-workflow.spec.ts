import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PostStatus, RoleName } from 'common/enums/database.enums';
import { PostAdminService } from './postAdminService';
import { PostOwnerService } from './postOwnerService';

describe('Post workflow', () => {
  const repo = { findOne: jest.fn(), save: jest.fn(async (value) => value) };
  const manager = { getRepository: jest.fn(() => repo) };
  const dataSource = { transaction: jest.fn(async (callback) => callback(manager)) };
  const audit = { record: jest.fn() };
  const actor = { id: 1, email: 'admin@test.com', userName: 'admin', fullName: 'Admin', role: RoleName.SuperAdmin };

  beforeEach(() => jest.clearAllMocks());

  describe('Super Admin review', () => {
    let service: PostAdminService;
    beforeEach(() => { service = new PostAdminService({} as never, dataSource as never, audit as never, { invalidatePrefix: jest.fn() } as never); });

    it('duyệt bài pending thành published', async () => {
      repo.findOne.mockResolvedValue({ id: '5', version: 1, status: PostStatus.Pending, translations: [{ title: 'Post' }] });
      const result = await service.approve(actor, '5', 1, '127.0.0.1');
      expect(result.message).toBe('POST_APPROVED');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: PostStatus.Published, reviewedBy: 1 }));
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'POST_APPROVED' }), manager);
    });

    it('không duyệt bài không ở trạng thái pending', async () => {
      repo.findOne.mockResolvedValue({ id: '5', version: 1, status: PostStatus.Draft, translations: [] });
      await expect(service.approve(actor, '5', 1, '127.0.0.1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('không duyệt phiên bản cũ khi tác giả đã sửa bài', async () => {
      repo.findOne.mockResolvedValue({ id: '5', version: 2, status: PostStatus.Pending, translations: [{ title: 'Post v2' }] });
      await expect(service.approve(actor, '5', 1, '127.0.0.1')).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('hủy duyệt đưa published về pending và xóa thông tin review', async () => {
      repo.findOne.mockResolvedValue({ id: '5', version: 1, status: PostStatus.Published, reviewedBy: 1, reviewedAt: new Date(), publishedAt: new Date(), translations: [{ title: 'Post' }] });
      const result = await service.unapprove(actor, '5', '127.0.0.1');
      expect(result.message).toBe('POST_APPROVAL_REVOKED');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: PostStatus.Pending, reviewedBy: null, reviewedAt: null, publishedAt: null }));
    });
  });

  describe('Blog Owner submit', () => {
    let service: PostOwnerService;
    beforeEach(() => {
      service = new PostOwnerService({} as never, dataSource as never, audit as never, { invalidatePrefix: jest.fn() } as never);
    });
    const owner = { ...actor, role: RoleName.BlogOwner };

    it('gửi draft có translation sang pending', async () => {
      repo.findOne.mockResolvedValue({ id: '9', version: 1, authorId: 1, status: PostStatus.Draft, rejectionReason: null, translations: [{ title: 'Draft' }] });
      const result = await service.submit(owner, '9', '127.0.0.1');
      expect(result.message).toBe('POST_SUBMITTED');
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ status: PostStatus.Pending }));
    });

    it('không gửi bài thiếu translation', async () => {
      repo.findOne.mockResolvedValue({ id: '9', version: 1, authorId: 1, status: PostStatus.Draft, translations: [] });
      await expect(service.submit(owner, '9', '127.0.0.1')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('không thao tác bài không thuộc owner', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.submit(owner, '9', '127.0.0.1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
