import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryService } from './categoryService';

describe('CategoryService - restore and cache invalidation', () => {
  const categories = { findOne: jest.fn(), save: jest.fn(async (value) => value) };
  const cache = { invalidatePrefix: jest.fn() };
  let service: CategoryService;

  beforeEach(() => { jest.clearAllMocks(); service = new CategoryService(categories as never, {} as never, {} as never, cache as never); });

  it('khôi phục category đã xóa và xóa cache danh sách', async () => {
    categories.findOne.mockResolvedValue({ id: 4, deletedAt: new Date() });
    const result = await service.restore(4);
    expect(result.data.item.deletedAt).toBeNull();
    expect(cache.invalidatePrefix).toHaveBeenCalledWith('categories:');
  });

  it('không restore category chưa bị xóa', async () => {
    categories.findOne.mockResolvedValue({ id: 4, deletedAt: null });
    await expect(service.restore(4)).rejects.toBeInstanceOf(ConflictException);
  });

  it('báo not found với category không tồn tại', async () => {
    categories.findOne.mockResolvedValue(null);
    await expect(service.restore(404)).rejects.toBeInstanceOf(NotFoundException);
  });
});
