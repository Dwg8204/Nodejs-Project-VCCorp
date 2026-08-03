import { BadRequestException } from '@nestjs/common';
import { AuthService } from './authService';

describe('AuthService - password reset protection', () => {
  const users = { createQueryBuilder: jest.fn(), update: jest.fn() };
  const roles = {};
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const configValues: Record<string, unknown> = {
    OTP_RESEND_COOLDOWN_SECONDS: 60, OTP_EXPIRES_IN_SECONDS: 180,
    OTP_MAX_ATTEMPTS: 5, JWT_SECRET: 'x'.repeat(64), BCRYPT_SALT_ROUNDS: 4,
  };
  const config = { getOrThrow: jest.fn((key: string) => configValues[key]) };
  const audit = { record: jest.fn() };
  const mail = { sendPasswordResetOtp: jest.fn() };
  let service: AuthService;

  const queryReturning = (value: unknown) => {
    const qb: Record<string, jest.Mock> = {};
    for (const method of ['leftJoinAndSelect', 'addSelect', 'where']) qb[method] = jest.fn(() => qb);
    qb.getOne = jest.fn().mockResolvedValue(value);
    users.createQueryBuilder.mockReturnValue(qb);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(users as never, roles as never, jwt as never, config as never, audit as never, mail as never);
  });

  it('không tiết lộ email không tồn tại và không gửi mail', async () => {
    queryReturning(null);
    const result = await service.forgotPassword({ email: 'missing@example.com' }, { ipAddress: '127.0.0.1' });
    expect(result.message).toBe('AUTH_RESET_INSTRUCTIONS_SENT');
    expect(mail.sendPasswordResetOtp).not.toHaveBeenCalled();
  });

  it('không gửi lại OTP trong thời gian cooldown', async () => {
    queryReturning({ id: 1, isActive: true, otpLastSentAt: new Date(), role: { nameRole: 'AUTHENTICATED_USER' } });
    const result = await service.forgotPassword({ email: 'a@example.com' }, { ipAddress: '127.0.0.1' });
    expect(result.message).toBe('AUTH_RESET_INSTRUCTIONS_SENT');
    expect(mail.sendPasswordResetOtp).not.toHaveBeenCalled();
    expect(users.update).not.toHaveBeenCalled();
  });

  it('từ chối OTP hết hạn và xóa trạng thái OTP', async () => {
    queryReturning({ id: 1, otpPurpose: 'PASSWORD_RESET', otpCodeHash: 'a'.repeat(64), otpExpiresAt: new Date(Date.now() - 1000), otpAttemptCount: 0, role: { nameRole: 'AUTHENTICATED_USER' } });
    await expect(service.verifyOtp({ email: 'a@example.com', otp: '123456' }, { ipAddress: '127.0.0.1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(users.update).toHaveBeenCalledWith(1, expect.objectContaining({ otpCodeHash: null, otpAttemptCount: 0 }));
  });

  it('từ chối reset khi mật khẩu xác nhận không khớp', async () => {
    await expect(service.resetPassword({ resetToken: 'x', newPassword: 'Password1', confirmPassword: 'Password2' }, { ipAddress: '127.0.0.1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });
});
