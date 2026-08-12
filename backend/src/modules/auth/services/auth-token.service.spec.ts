import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import { User } from 'modules/user/models/user';
import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  const users = {
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<Repository<User>>;
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() } as unknown as jest.Mocked<JwtService>;
  const config = {
    getOrThrow: jest.fn((key: string) => ({
      JWT_REFRESH_SECRET: 'r'.repeat(32),
      JWT_REFRESH_EXPIRES_IN: '7d',
      AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS: 604800,
    })[key]),
  } as unknown as jest.Mocked<ConfigService>;
  const dataSource = { transaction: jest.fn() } as unknown as jest.Mocked<DataSource>;
  let service: AuthTokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthTokenService(users, dataSource, jwt, config);
  });

  it('chỉ lưu hash khi cấp refresh token mới', async () => {
    jwt.signAsync.mockResolvedValueOnce('refresh-token').mockResolvedValueOnce('access-token');
    users.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
    const user = { id: 7, email: 'a@b.com', userName: 'a', role: { nameRole: 'AUTHENTICATED_USER' } } as User;

    await expect(service.issue(user)).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(users.update).toHaveBeenCalledWith(7, expect.objectContaining({
      refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
    expect(users.update).not.toHaveBeenCalledWith(7, expect.objectContaining({
      refreshTokenHash: 'refresh-token',
    }));
  });

  it('xóa refresh token duy nhất của user khi cần thu hồi', async () => {
    users.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
    await service.revokeUser(9);
    expect(users.update).toHaveBeenCalledWith(9, {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
  });
});
