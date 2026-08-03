import { AuditService } from './audit.service';

describe('AuditService', () => {
  const repository = { create: jest.fn((value) => value), save: jest.fn(async (value) => ({ id: '1', ...value })) };
  let service: AuditService;

  beforeEach(() => { jest.clearAllMocks(); service = new AuditService(repository as never); });

  it('chuẩn hóa id, null và giới hạn user-agent trước khi lưu', async () => {
    const result = await service.record({ action: 'POST_APPROVED', entityType: 'POST', entityId: 12, userAgent: 'x'.repeat(700) });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ actorId: null, entityId: '12', metadata: null, userAgent: 'x'.repeat(500) }));
    expect(result.id).toBe('1');
  });

  it('dùng repository của transaction manager khi được truyền vào', async () => {
    const transactionRepository = { create: jest.fn((value) => value), save: jest.fn(async (value) => value) };
    const manager = { getRepository: jest.fn(() => transactionRepository) };
    await service.record({ action: 'USER_LOCKED', entityType: 'USER' }, manager as never);
    expect(transactionRepository.save).toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
