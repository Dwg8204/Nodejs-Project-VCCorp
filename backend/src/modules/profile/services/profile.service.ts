import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditService } from 'modules/audit/services/audit.service';
import { RequestContext } from 'modules/auth/interfaces/auth-user.interface';
import { AuthTokenService } from 'modules/auth/services/auth-token.service';
import { User } from 'modules/user/models/user';
import { CloudinaryService } from 'modules/upload/services/cloudinary.service';
import { Repository } from 'typeorm';
import {
  ChangePasswordDto,
  ProfileImageType,
  UpdateProfileDto,
} from '../validations/profile.validation';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly config: ConfigService,
    private readonly tokens: AuthTokenService,
  ) {}

  async findProfile(userId: number) {
    const user = await this.findUser(userId);
    return { success: true, data: { user: this.toProfile(user) } };
  }

  async findPublicProfile(userId: number) {
    const user = await this.findUser(userId);
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          userName: user.userName,
          fullName: user.fullName,
          avatar: user.avatar,
          coverImage: user.coverImage,
          role: user.role.nameRole,
          createdAt: user.createdAt,
        },
      },
    };
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
    context: RequestContext,
  ) {
    const user = await this.findUser(userId);
    const before = this.toProfile(user);

    if (dto.dateOfBirth && dto.dateOfBirth >= this.currentDate()) {
      throw new BadRequestException('PROFILE_DATE_OF_BIRTH_IN_FUTURE');
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName?.trim() || null;
    if (dto.phone !== undefined) user.phone = dto.phone?.trim() || null;
    if (dto.dateOfBirth !== undefined) user.dateOfBirth = dto.dateOfBirth;
    await this.userRepository.save(user);
    const after = this.toProfile(user);
    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: user.role.nameRole,
      action: 'PROFILE_UPDATED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.email,
      beforeData: before,
      afterData: after,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      success: true,
      message: 'PROFILE_UPDATE_SUCCEEDED',
      data: { user: after },
    };
  }

  private currentDate(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const value = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${value.year}-${value.month}-${value.day}`;
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
    context: RequestContext,
  ) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('PROFILE_PASSWORD_CONFIRMATION_MISMATCH');
    }
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user) throw new NotFoundException('PROFILE_NOT_FOUND');
    if (!(await user.comparePassword(dto.currentPassword))) {
      throw new BadRequestException('PROFILE_CURRENT_PASSWORD_INVALID');
    }
    if (await user.comparePassword(dto.newPassword)) {
      throw new BadRequestException('PROFILE_PASSWORD_UNCHANGED');
    }

    user.passwordHash = await bcrypt.hash(
      dto.newPassword,
      this.config.getOrThrow<number>('BCRYPT_SALT_ROUNDS'),
    );
    user.passwordChangedAt = new Date();
    user.otpCodeHash = null;
    user.otpPurpose = null;
    user.otpExpiresAt = null;
    user.otpAttemptCount = 0;
    user.otpLastSentAt = null;
    await this.userRepository.save(user);
    await this.tokens.revokeUser(user.id);
    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: user.role.nameRole,
      action: 'PROFILE_PASSWORD_UPDATED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.email,
      metadata: { passwordChangedAt: user.passwordChangedAt.toISOString() },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return {
      success: true,
      message: 'PROFILE_PASSWORD_UPDATE_SUCCEEDED',
      data: null,
    };
  }

  async uploadImage(
    userId: number,
    type: ProfileImageType,
    file: Express.Multer.File,
    context: RequestContext,
  ) {
    const user = await this.findUser(userId);
    const before = this.toProfile(user);
    const uploaded = await this.cloudinaryService.uploadImage({
      buffer: file.buffer,
      publicId: this.cloudinaryService.profilePublicId(user.id, type),
      preset: type,
    });

    if (type === ProfileImageType.Avatar) user.avatar = uploaded.secure_url;
    else user.coverImage = uploaded.secure_url;

    await this.userRepository.save(user);
    const after = this.toProfile(user);
    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: user.role.nameRole,
      action:
        type === ProfileImageType.Avatar
          ? 'PROFILE_AVATAR_UPDATED'
          : 'PROFILE_COVER_UPDATED',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: user.email,
      beforeData: before,
      afterData: after,
      metadata: {
        provider: 'cloudinary',
        publicId: uploaded.public_id,
        bytes: uploaded.bytes,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      success: true,
      message: 'PROFILE_IMAGE_UPDATE_SUCCEEDED',
      data: {
        user: after,
        image: {
          type,
          url: uploaded.secure_url,
          width: uploaded.width,
          height: uploaded.height,
        },
      },
    };
  }

  private async findUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('PROFILE_NOT_FOUND');
    return user;
  }

  private toProfile(user: User) {
    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      avatar: user.avatar,
      coverImage: user.coverImage,
      emailVerified: user.emailVerified,
      role: user.role.nameRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
