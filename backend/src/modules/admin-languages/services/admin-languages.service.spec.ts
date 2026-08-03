import { ConflictException } from '@nestjs/common';
import { LanguageTranslationStatus, RoleName } from 'common/enums/database.enums';
import { AdminLanguagesService } from './admin-languages.service';

describe('AdminLanguagesService', () => {
  const qb: Record<string, jest.Mock> = {};
  const languages = { createQueryBuilder: jest.fn(), save: jest.fn(async (value) => value) };
  const audit = { record: jest.fn() };
  const cache = { invalidatePrefix: jest.fn() };
  const actor = { id: 1, email: 'admin@test.com', userName: 'admin', fullName: 'Admin', role: RoleName.SuperAdmin };
  const context = { ipAddress: '127.0.0.1' };
  let service: AdminLanguagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const method of ['leftJoinAndSelect', 'where', 'withDeleted']) qb[method] = jest.fn(() => qb);
    qb.getOne = jest.fn();
    languages.createQueryBuilder.mockReturnValue(qb);
    service = new AdminLanguagesService(languages as never, audit as never, cache as never);
  });

  it('khôi phục language về inactive + draft', async () => {
    qb.getOne.mockResolvedValue({ id: 3, code: 'zh', name: 'Tiếng Trung', deletedAt: new Date(), isActive: false, isSystemLanguage: false, translationStatus: LanguageTranslationStatus.Disabled });
    const result = await service.restore(3, actor, context);
    expect(result.data.language).toEqual(expect.objectContaining({ isActive: false, translationStatus: LanguageTranslationStatus.Draft, deletedAt: null }));
    expect(cache.invalidatePrefix).toHaveBeenCalledWith('languages:');
  });

  it('không xóa system language', async () => {
    qb.getOne.mockResolvedValue({ id: 1, code: 'vi', isSystemLanguage: true, deletedAt: null });
    await expect(service.softDelete(1, actor, context)).rejects.toBeInstanceOf(ConflictException);
    expect(languages.save).not.toHaveBeenCalled();
  });

  it('không restore language chưa bị xóa', async () => {
    qb.getOne.mockResolvedValue({ id: 3, deletedAt: null });
    await expect(service.restore(3, actor, context)).rejects.toBeInstanceOf(ConflictException);
  });
});
