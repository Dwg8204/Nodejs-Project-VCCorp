import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const users = { findOne: jest.fn(), save: jest.fn(async (value) => value), createQueryBuilder: jest.fn() };
  const audit = { record: jest.fn() };
  const cloudinary = {};
  const config = { getOrThrow: jest.fn(() => 4) };
  let service: ProfileService;

  beforeEach(() => { jest.clearAllMocks(); service = new ProfileService(users as never, audit as never, cloudinary as never, config as never); });

  it('chỉ trả trường công khai cho public profile', async () => {
    users.findOne.mockResolvedValue({ id: 3, userName: 'owner', fullName: 'Owner', email: 'secret@test.com', phone: '0900', avatar: null, coverImage: null, createdAt: new Date(), role: { nameRole: 'BLOG_OWNER' } });
    const result = await service.findPublicProfile(3);
    expect(result.data.user).not.toHaveProperty('email');
    expect(result.data.user).not.toHaveProperty('phone');
    expect(result.data.user.role).toBe('BLOG_OWNER');
  });

  it('trim dữ liệu và ghi before/after khi cập nhật profile', async () => {
    users.findOne.mockResolvedValue({ id: 3, userName: 'owner', fullName: 'Old', email: 'o@test.com', phone: null, avatar: null, coverImage: null, dateOfBirth: null, emailVerified: false, createdAt: new Date(), updatedAt: new Date(), role: { nameRole: 'BLOG_OWNER' } });
    const result = await service.updateProfile(3, { fullName: '  New Name  ', phone: '0901234567' }, { ipAddress: '127.0.0.1' });
    expect(result.data.user.fullName).toBe('New Name');
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROFILE_UPDATED', beforeData: expect.any(Object), afterData: expect.any(Object) }));
  });

  it('rejects a date of birth in the future', async () => {
    users.findOne.mockResolvedValue({ id: 3, userName: 'owner', fullName: 'Old', email: 'o@test.com', phone: null, avatar: null, coverImage: null, dateOfBirth: null, emailVerified: false, createdAt: new Date(), updatedAt: new Date(), role: { nameRole: 'BLOG_OWNER' } });
    await expect(
      service.updateProfile(3, { dateOfBirth: '2999-01-01' }, { ipAddress: '127.0.0.1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('rejects today as a date of birth', async () => {
    users.findOne.mockResolvedValue({ id: 3, userName: 'owner', fullName: 'Old', email: 'o@test.com', phone: null, avatar: null, coverImage: null, dateOfBirth: null, emailVerified: false, createdAt: new Date(), updatedAt: new Date(), role: { nameRole: 'BLOG_OWNER' } });
    const today = (service as any).currentDate();
    await expect(
      service.updateProfile(3, { dateOfBirth: today }, { ipAddress: '127.0.0.1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('từ chối mật khẩu xác nhận không khớp trước khi query database', async () => {
    await expect(service.changePassword(3, { currentPassword: 'OldPassword1', newPassword: 'NewPassword1', confirmPassword: 'OtherPassword1' }, { ipAddress: '127.0.0.1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(users.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('báo không tìm thấy profile', async () => {
    users.findOne.mockResolvedValue(null);
    await expect(service.findProfile(404)).rejects.toBeInstanceOf(NotFoundException);
  });
});
