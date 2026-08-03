import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from 'common/enums/database.enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const context = (user?: object) => ({
    getHandler: jest.fn(), getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  });
  let guard: RolesGuard;

  beforeEach(() => { jest.clearAllMocks(); guard = new RolesGuard(reflector as unknown as Reflector); });

  it('cho qua route không khai báo role', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(context() as never)).toBe(true);
  });

  it('cho Super Admin vào route admin', () => {
    reflector.getAllAndOverride.mockReturnValue([RoleName.SuperAdmin]);
    expect(guard.canActivate(context({ role: RoleName.SuperAdmin }) as never)).toBe(true);
  });

  it('từ chối user sai role hoặc chưa đăng nhập', () => {
    reflector.getAllAndOverride.mockReturnValue([RoleName.SuperAdmin]);
    expect(() => guard.canActivate(context({ role: RoleName.BlogOwner }) as never)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context() as never)).toThrow(ForbiddenException);
  });
});
