import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { RoleName } from 'common/enums/database.enums';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const config = { getOrThrow: jest.fn(() => 'vccorp_access_token') };
  const users = { findOne: jest.fn() };
  const request = { headers: {} as Record<string, string>, user: undefined as unknown };
  const context = { switchToHttp: () => ({ getRequest: () => request }) };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks(); request.headers = {}; request.user = undefined;
    guard = new JwtAuthGuard(jwt as never, config as never, users as never);
  });

  it('ưu tiên đọc JWT từ HttpOnly cookie', async () => {
    request.headers.cookie = 'theme=dark; vccorp_access_token=cookie-token';
    jwt.verifyAsync.mockResolvedValue({ sub: 2, iat: 100 });
    users.findOne.mockResolvedValue({ id: 2, email: 'a@a.com', userName: 'a', fullName: 'A', isActive: true, passwordChangedAt: null, role: { nameRole: RoleName.BlogOwner } });
    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('cookie-token');
    expect(request.user).toEqual(expect.objectContaining({ id: 2, role: RoleName.BlogOwner }));
  });

  it('từ chối khi không có token', async () => {
    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('từ chối tài khoản đã khóa', async () => {
    request.headers.authorization = 'Bearer abc';
    jwt.verifyAsync.mockResolvedValue({ sub: 2, iat: 100 });
    users.findOne.mockResolvedValue({ id: 2, isActive: false });
    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('thu hồi token được cấp trước lần đổi mật khẩu', async () => {
    request.headers.authorization = 'Bearer old';
    jwt.verifyAsync.mockResolvedValue({ sub: 2, iat: 100 });
    users.findOne.mockResolvedValue({ id: 2, isActive: true, passwordChangedAt: new Date(101_000), role: { nameRole: RoleName.AuthenticatedUser } });
    await expect(guard.canActivate(context as never)).rejects.toMatchObject({ response: { message: 'AUTH_TOKEN_REVOKED' } });
  });
});
