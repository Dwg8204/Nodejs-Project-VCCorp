import { LanguageTranslationStatus } from 'common/enums/database.enums';
import { LanguagesService } from './languages.service';

describe('LanguagesService', () => {
  const repository = { find: jest.fn() };
  const cache = { getOrSet: jest.fn(async (_key, _ttl, loader) => loader()) };
  let service: LanguagesService;

  beforeEach(() => { jest.clearAllMocks(); service = new LanguagesService(repository as never, cache as never); });

  it('cache danh sách language public 600 giây và chỉ trả field an toàn', async () => {
    repository.find.mockResolvedValue([{ id: 1, code: 'vi', name: 'Tiếng Việt', flag: 'flag', fallbackLanguageId: null, isActive: true, secret: 'hidden' }]);
    const result = await service.findAvailable();
    expect(cache.getOrSet).toHaveBeenCalledWith('languages:available', 600, expect.any(Function));
    expect(repository.find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ isActive: true, translationStatus: LanguageTranslationStatus.Ready }) }));
    expect(result.data.items[0]).toEqual({ id: 1, code: 'vi', name: 'Tiếng Việt', flag: 'flag', fallbackLanguageId: null });
  });
});
