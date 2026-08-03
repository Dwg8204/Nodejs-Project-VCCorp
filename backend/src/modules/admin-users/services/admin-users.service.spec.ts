import { ForbiddenException } from '@nestjs/common';
import { RoleName } from 'common/enums/database.enums';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService - self protection', () => {
  const users = { findOne: jest.fn(), save: jest.fn() };
  const roles = { findOne: jest.fn() };
  const audit = { record: jest.fn() };
  const actor = { id: 1, email: 'admin@test.com', userName: 'admin', fullName: 'Admin', role: RoleName.SuperAdmin };
  const context = { ipAddress: '127.0.0.1' };
  let service: AdminUsersService;

  beforeEach(() => { jest.clearAllMocks(); service = new AdminUsersService(users as never, roles as never, audit as never); });

  it('admin không thể tự khóa tài khoản', async () => {
    await expect(service.lock(1, actor, context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('admin không thể tự đổi role', async () => {
    await expect(service.changeRole(1, { role: RoleName.BlogOwner }, actor, context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.findOne).not.toHaveBeenCalled();
  });
});
