import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { OtpPurpose, RoleName } from 'common/enums/database.enums';
import { AuditService } from 'modules/audit/services/audit.service';
import { Role } from 'modules/user/models/role';
import { User } from 'modules/user/models/user';
import { Repository } from 'typeorm';
import {
  AuthenticatedUser,
  JwtPayload,
  RequestContext,
} from '../interfaces/auth-user.interface';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from '../validations/authValidation';

interface ResetProofPayload {
  sub: number;
  purpose: 'PASSWORD_RESET_PROOF';
  otpHash: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, context: RequestContext) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('AUTH_PASSWORD_CONFIRMATION_MISMATCH');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedUserName = dto.userName.trim();
    const duplicate = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: normalizedEmail })
      .orWhere('LOWER(user.user_name) = :userName', {
        userName: normalizedUserName.toLowerCase(),
      })
      .getOne();
    if (duplicate) {
      throw new ConflictException(
        duplicate.email.toLowerCase() === normalizedEmail
          ? 'AUTH_EMAIL_ALREADY_EXISTS'
          : 'AUTH_USERNAME_ALREADY_EXISTS',
      );
    }

    const defaultRole = await this.roleRepository.findOne({
      where: { nameRole: RoleName.AuthenticatedUser },
    });
    if (!defaultRole) {
      throw new ConflictException('AUTH_DEFAULT_ROLE_NOT_CONFIGURED');
    }

    const user = this.userRepository.create({
      userName: normalizedUserName,
      fullName: dto.fullName.trim(),
      email: normalizedEmail,
      passwordHash: dto.password,
      roleId: defaultRole.id,
      role: defaultRole,
      isActive: true,
    });
    await this.userRepository.save(user);

    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: defaultRole.nameRole,
      action: 'AUTH_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      success: true,
      message: 'AUTH_REGISTER_SUCCEEDED',
      data: {
        user: this.toSafeUser(user),
        accessToken: await this.signAccessToken(user),
      },
    };
  }

  async login(dto: LoginDto, context: RequestContext) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = :email', { email: normalizedEmail })
      .getOne();

    if (!user || !(await user.comparePassword(dto.password))) {
      await this.auditService.record({
        actorId: user?.id ?? null,
        actorName: user?.fullName ?? user?.userName ?? null,
        actorRole: user?.role?.nameRole ?? null,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'USER',
        entityId: user?.id ?? null,
        entityLabel: this.maskEmail(normalizedEmail),
        metadata: { reason: 'INVALID_CREDENTIALS' },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new UnauthorizedException('AUTH_INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      await this.auditService.record({
        actorId: user.id,
        actorName: user.fullName ?? user.userName,
        actorRole: user.role.nameRole,
        action: 'AUTH_LOGIN_FAILED',
        entityType: 'USER',
        entityId: user.id,
        entityLabel: user.email,
        metadata: { reason: 'ACCOUNT_LOCKED' },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new ForbiddenException('AUTH_ACCOUNT_LOCKED');
    }

    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: user.role.nameRole,
      action: 'AUTH_LOGIN_SUCCEEDED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      success: true,
      message: 'AUTH_LOGIN_SUCCEEDED',
      data: {
        user: this.toSafeUser(user),
        accessToken: await this.signAccessToken(user),
      },
    };
  }

  async me(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('AUTH_USER_NOT_FOUND');
    }
    return {
      success: true,
      data: { user: this.toSafeUser(user) },
    };
  }

  async logout(user: AuthenticatedUser, context: RequestContext) {
    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: user.role,
      action: 'AUTH_LOGOUT',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return { success: true, message: 'AUTH_LOGOUT_SUCCEEDED', data: null };
  }

  async forgotPassword(dto: ForgotPasswordDto, context: RequestContext) {
    const genericResponse = {
      success: true,
      message: 'AUTH_RESET_INSTRUCTIONS_SENT',
      data: null as null | { developmentOtp: string },
    };
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect([
        'user.otpLastSentAt',
        'user.otpAttemptCount',
        'user.otpPurpose',
      ])
      .where('LOWER(user.email) = :email', { email: normalizedEmail })
      .getOne();

    if (!user || !user.isActive) {
      return genericResponse;
    }

    const cooldownSeconds = this.config.getOrThrow<number>(
      'OTP_RESEND_COOLDOWN_SECONDS',
    );
    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() < cooldownSeconds * 1000
    ) {
      return genericResponse;
    }

    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresInSeconds = this.config.getOrThrow<number>(
      'OTP_EXPIRES_IN_SECONDS',
    );
    const otpCodeHash = this.hashOtp(user.id, OtpPurpose.PasswordReset, otp);
    const now = new Date();

    await this.userRepository.update(user.id, {
      otpCodeHash,
      otpPurpose: OtpPurpose.PasswordReset,
      otpExpiresAt: new Date(now.getTime() + expiresInSeconds * 1000),
      otpAttemptCount: 0,
      otpLastSentAt: now,
    });
    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: user.role.nameRole,
      action: 'AUTH_PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    // Chỉ phục vụ kiểm thử local cho đến khi tích hợp nhà cung cấp email.
    if (this.config.getOrThrow<string>('NODE_ENV') !== 'production') {
      genericResponse.data = { developmentOtp: otp };
    }
    return genericResponse;
  }

  async verifyOtp(dto: VerifyOtpDto, context: RequestContext) {
    const user = await this.findUserWithOtp(dto.email);
    const maxAttempts = this.config.getOrThrow<number>('OTP_MAX_ATTEMPTS');

    if (
      !user ||
      user.otpPurpose !== OtpPurpose.PasswordReset ||
      !user.otpCodeHash ||
      !user.otpExpiresAt
    ) {
      throw new BadRequestException('AUTH_OTP_INVALID_OR_EXPIRED');
    }
    if (user.otpExpiresAt.getTime() <= Date.now()) {
      await this.clearOtp(user.id);
      throw new BadRequestException('AUTH_OTP_INVALID_OR_EXPIRED');
    }
    if (user.otpAttemptCount >= maxAttempts) {
      throw new HttpException(
        'AUTH_OTP_ATTEMPTS_EXCEEDED',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const candidateHash = this.hashOtp(
      user.id,
      OtpPurpose.PasswordReset,
      dto.otp,
    );
    if (!this.safeHashEquals(candidateHash, user.otpCodeHash)) {
      await this.userRepository.update(user.id, {
        otpAttemptCount: user.otpAttemptCount + 1,
      });
      await this.auditService.record({
        actorId: user.id,
        actorName: user.fullName ?? user.userName,
        actorRole: user.role.nameRole,
        action: 'AUTH_OTP_VERIFICATION_FAILED',
        entityType: 'USER',
        entityId: user.id,
        entityLabel: user.email,
        metadata: { attempt: user.otpAttemptCount + 1 },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new BadRequestException('AUTH_OTP_INVALID_OR_EXPIRED');
    }

    const resetToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        purpose: 'PASSWORD_RESET_PROOF',
        otpHash: user.otpCodeHash,
      } satisfies Omit<ResetProofPayload, 'iat' | 'exp'>,
      { expiresIn: '5m' },
    );
    return {
      success: true,
      message: 'AUTH_OTP_VERIFIED',
      data: { resetToken },
    };
  }

  async resetPassword(dto: ResetPasswordDto, context: RequestContext) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('AUTH_PASSWORD_CONFIRMATION_MISMATCH');
    }

    let proof: ResetProofPayload;
    try {
      proof = await this.jwtService.verifyAsync<ResetProofPayload>(
        dto.resetToken,
      );
    } catch {
      throw new BadRequestException('AUTH_RESET_TOKEN_INVALID_OR_EXPIRED');
    }
    if (proof.purpose !== 'PASSWORD_RESET_PROOF') {
      throw new BadRequestException('AUTH_RESET_TOKEN_INVALID_OR_EXPIRED');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect(['user.otpCodeHash', 'user.otpPurpose', 'user.otpExpiresAt'])
      .where('user.id = :id', { id: proof.sub })
      .getOne();
    if (
      !user ||
      !user.otpCodeHash ||
      user.otpPurpose !== OtpPurpose.PasswordReset ||
      !user.otpExpiresAt ||
      user.otpExpiresAt.getTime() <= Date.now() ||
      !this.safeHashEquals(proof.otpHash, user.otpCodeHash)
    ) {
      throw new BadRequestException('AUTH_RESET_TOKEN_INVALID_OR_EXPIRED');
    }

    const saltRounds = this.config.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.userRepository.update(user.id, {
      passwordHash,
      passwordChangedAt: new Date(),
      otpCodeHash: null,
      otpPurpose: null,
      otpExpiresAt: null,
      otpAttemptCount: 0,
      otpLastSentAt: null,
    });
    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: user.role.nameRole,
      action: 'AUTH_PASSWORD_RESET_SUCCEEDED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      success: true,
      message: 'AUTH_PASSWORD_RESET_SUCCEEDED',
      data: null,
    };
  }

  private async signAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.userName,
      role: user.role.nameRole,
    };
    return this.jwtService.signAsync(payload);
  }

  private async findUserWithOtp(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect([
        'user.otpCodeHash',
        'user.otpPurpose',
        'user.otpExpiresAt',
        'user.otpAttemptCount',
      ])
      .where('LOWER(user.email) = :email', {
        email: email.trim().toLowerCase(),
      })
      .getOne();
  }

  private clearOtp(userId: number): Promise<unknown> {
    return this.userRepository.update(userId, {
      otpCodeHash: null,
      otpPurpose: null,
      otpExpiresAt: null,
      otpAttemptCount: 0,
      otpLastSentAt: null,
    });
  }

  private hashOtp(userId: number, purpose: OtpPurpose, otp: string): string {
    return createHmac(
      'sha256',
      this.config.getOrThrow<string>('JWT_SECRET'),
    )
      .update(`${userId}:${purpose}:${otp}`)
      .digest('hex');
  }

  private safeHashEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain ?? ''}`;
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      coverImage: user.coverImage,
      dateOfBirth: user.dateOfBirth,
      emailVerified: user.emailVerified,
      role: user.role.nameRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
