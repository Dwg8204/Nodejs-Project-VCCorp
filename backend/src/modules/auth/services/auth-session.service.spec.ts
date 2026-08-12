import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  const repository = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    createQueryBuilder: jest.fn(),
  };
  const dataSource = { transaction: jest.fn() };
  const jwt = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const values: Record<string, unknown> = {
    JWT_REFRESH_SECRET: 'r'.repeat(64),
    JWT_REFRESH_EXPIRES_IN: '7d',
    AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS: 604800,
  };
  const config = { getOrThrow: jest.fn((key: string) => values[key]) };
  let service: AuthSessionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthSessionService(
      repository as never,
      dataSource as never,
      jwt as never,
      config as never,
    );
  });

  it('chỉ lưu hash của refresh token khi tạo phiên', async () => {
    jwt.signAsync
      .mockResolvedValueOnce('refresh-token-plain')
      .mockResolvedValueOnce('access-token');
    const user = {
      id: 7,
      email: 'owner@example.com',
      userName: 'owner',
      role: { nameRole: 'BLOG_OWNER' },
    };

    const result = await service.create(user as never, {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token-plain',
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(repository.save.mock.calls[0][0].refreshTokenHash)
      .not.toBe('refresh-token-plain');
  });

  it('thu hồi tất cả phiên chưa bị thu hồi của một user', async () => {
    const builder = {
      update: jest.fn(),
      set: jest.fn(),
      where: jest.fn(),
      execute: jest.fn().mockResolvedValue({ affected: 2 }),
    };
    builder.update.mockReturnValue(builder);
    builder.set.mockReturnValue(builder);
    builder.where.mockReturnValue(builder);
    repository.createQueryBuilder.mockReturnValue(builder);

    await service.revokeAll(7);

    expect(builder.where).toHaveBeenCalledWith(
      'user_id = :userId AND revoked_at IS NULL',
      { userId: 7 },
    );
    expect(builder.execute).toHaveBeenCalled();
  });
});
