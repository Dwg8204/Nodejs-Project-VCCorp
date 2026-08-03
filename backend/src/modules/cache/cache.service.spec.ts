import { AppCacheService } from './cache.service';

describe('AppCacheService - memory mode', () => {
  const config = {
    get: jest.fn((key: string, fallback: unknown) => key === 'REDIS_ENABLED' ? false : fallback),
  };
  let cache: AppCacheService;

  beforeEach(() => { jest.clearAllMocks(); cache = new AppCacheService(config as never); });

  it('chỉ gọi loader một lần khi key còn TTL', async () => {
    const loader = jest.fn().mockResolvedValue({ items: [1, 2] });
    await expect(cache.getOrSet('categories:test', 60, loader)).resolves.toEqual({ items: [1, 2] });
    await expect(cache.getOrSet('categories:test', 60, loader)).resolves.toEqual({ items: [1, 2] });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('invalidatePrefix buộc tải lại nhóm cache tương ứng', async () => {
    const loader = jest.fn().mockResolvedValue('value');
    await cache.getOrSet('languages:available', 60, loader);
    await cache.invalidatePrefix('languages:');
    await cache.getOrSet('languages:available', 60, loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('không xóa key thuộc prefix khác', async () => {
    const languageLoader = jest.fn().mockResolvedValue('languages');
    const categoryLoader = jest.fn().mockResolvedValue('categories');
    await cache.getOrSet('languages:available', 60, languageLoader);
    await cache.getOrSet('categories:list', 60, categoryLoader);
    await cache.invalidatePrefix('languages:');
    await cache.getOrSet('categories:list', 60, categoryLoader);
    expect(categoryLoader).toHaveBeenCalledTimes(1);
  });
});
