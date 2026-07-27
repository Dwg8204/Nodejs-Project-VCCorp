import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditService } from 'modules/audit/services/audit.service';
import { RequestContext } from 'modules/auth/interfaces/auth-user.interface';
import { User } from 'modules/user/models/user';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from '../validations/profile.validation';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async findProfile(userId: number) {
    const user = await this.findUser(userId);
    return { success: true, data: { user: this.toProfile(user) } };
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
    context: RequestContext,
  ) {
    const user = await this.findUser(userId);
    const before = this.toProfile(user);

    if (dto.fullName !== undefined) user.fullName = dto.fullName?.trim() || null;
    if (dto.phone !== undefined) user.phone = dto.phone?.trim() || null;
    if (dto.dateOfBirth !== undefined) user.dateOfBirth = dto.dateOfBirth;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.coverImage !== undefined) user.coverImage = dto.coverImage;

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
