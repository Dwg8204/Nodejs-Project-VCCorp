import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName } from 'common/enums/database.enums';
import { AuditService } from 'modules/audit/services/audit.service';
import {
  AuthenticatedUser,
  RequestContext,
} from 'modules/auth/interfaces/auth-user.interface';
import { Role } from 'modules/user/models/role';
import { User } from 'modules/user/models/user';
import { Brackets, Repository } from 'typeorm';
import {
  ChangeUserRoleDto,
  CreateAdminUserDto,
  QueryAdminUsersDto,
  UpdateAdminUserDto,
  UserSort,
  UserStatusFilter,
} from '../validations/admin-users.validation';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(dto: QueryAdminUsersDto) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    if (dto.search?.trim()) {
      query.andWhere(
        new Brackets((where) => {
          where
            .where('user.user_name LIKE :search')
            .orWhere('user.full_name LIKE :search')
            .orWhere('user.email LIKE :search');
        }),
        { search: `%${dto.search.trim()}%` },
      );
    }
    if (dto.role) {
      query.andWhere('role.name_role = :role', { role: dto.role });
    }
    if (dto.status) {
      query.andWhere('user.is_active = :isActive', {
        isActive: dto.status === UserStatusFilter.Active,
      });
    }

    const sortMap: Record<UserSort, [string, 'ASC' | 'DESC']> = {
      [UserSort.Newest]: ['user.createdAt', 'DESC'],
      [UserSort.Oldest]: ['user.createdAt', 'ASC'],
      [UserSort.Ascending]: ['user.fullName', 'ASC'],
      [UserSort.Descending]: ['user.fullName', 'DESC'],
    };
    const [sortColumn, sortDirection] = sortMap[dto.sort];
    query
      .orderBy(sortColumn, sortDirection)
      .addOrderBy('user.id', sortDirection)
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    const [users, total] = await query.getManyAndCount();
    return {
      success: true,
      data: {
        items: users.map((user) => this.toAdminUser(user)),
        pagination: {
          page: dto.page,
          limit: dto.limit,
          total,
          totalPages: Math.ceil(total / dto.limit),
        },
      },
    };
  }

  async findOne(id: number) {
    const user = await this.findUser(id);
    return { success: true, data: { user: this.toAdminUser(user) } };
  }

  async create(
    dto: CreateAdminUserDto,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    const email = dto.email.trim().toLowerCase();
    const userName = dto.userName.trim();
    await this.assertIdentityAvailable(email, userName);
    const role = await this.findRole(dto.role);

    const user = this.userRepository.create({
      email,
      userName,
      fullName: dto.fullName.trim(),
      phone: dto.phone?.trim() ?? null,
      passwordHash: dto.password,
      emailVerified: true,
      isActive: true,
      roleId: role.id,
      role,
    });
    await this.userRepository.save(user);
    await this.recordChange(
      'USER_CREATED',
      actor,
      user,
      null,
      this.toAuditUser(user),
      context,
    );
    return {
      success: true,
      message: 'ADMIN_USER_CREATE_SUCCEEDED',
      data: { user: this.toAdminUser(user) },
    };
  }

  async update(
    id: number,
    dto: UpdateAdminUserDto,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    const user = await this.findUser(id);
    const before = this.toAuditUser(user);

    const email = dto.email?.trim().toLowerCase();
    const userName = dto.userName?.trim();
    if (email || userName) {
      await this.assertIdentityAvailable(
        email ?? user.email,
        userName ?? user.userName,
        user.id,
      );
    }
    if (email !== undefined) user.email = email;
    if (userName !== undefined) user.userName = userName;
    if (dto.fullName !== undefined) user.fullName = dto.fullName?.trim() || null;
    if (dto.phone !== undefined) user.phone = dto.phone?.trim() || null;

    await this.userRepository.save(user);
    await this.recordChange(
      'USER_UPDATED',
      actor,
      user,
      before,
      this.toAuditUser(user),
      context,
    );
    return {
      success: true,
      message: 'ADMIN_USER_UPDATE_SUCCEEDED',
      data: { user: this.toAdminUser(user) },
    };
  }

  async changeRole(
    id: number,
    dto: ChangeUserRoleDto,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    if (id === actor.id) {
      throw new ForbiddenException('ADMIN_CANNOT_CHANGE_OWN_ROLE');
    }
    const user = await this.findUser(id);
    if (user.role.nameRole === dto.role) {
      return {
        success: true,
        message: 'ADMIN_USER_ROLE_UNCHANGED',
        data: { user: this.toAdminUser(user) },
      };
    }
    if (user.role.nameRole === RoleName.SuperAdmin) {
      await this.assertAnotherSuperAdminExists(user.id);
    }

    const before = this.toAuditUser(user);
    const role = await this.findRole(dto.role);
    user.roleId = role.id;
    user.role = role;
    await this.userRepository.save(user);
    await this.recordChange(
      'USER_ROLE_CHANGED',
      actor,
      user,
      before,
      this.toAuditUser(user),
      context,
    );
    return {
      success: true,
      message: 'ADMIN_USER_ROLE_CHANGE_SUCCEEDED',
      data: { user: this.toAdminUser(user) },
    };
  }

  async lock(
    id: number,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    if (id === actor.id) {
      throw new ForbiddenException('ADMIN_CANNOT_LOCK_SELF');
    }
    return this.changeActiveState(id, false, actor, context);
  }

  async unlock(
    id: number,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    return this.changeActiveState(id, true, actor, context);
  }

  private async changeActiveState(
    id: number,
    isActive: boolean,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    const user = await this.findUser(id);
    if (user.isActive === isActive) {
      return {
        success: true,
        message: isActive
          ? 'ADMIN_USER_ALREADY_UNLOCKED'
          : 'ADMIN_USER_ALREADY_LOCKED',
        data: { user: this.toAdminUser(user) },
      };
    }
    if (!isActive && user.role.nameRole === RoleName.SuperAdmin) {
      await this.assertAnotherSuperAdminExists(user.id);
    }

    const before = this.toAuditUser(user);
    user.isActive = isActive;
    await this.userRepository.save(user);
    await this.recordChange(
      isActive ? 'USER_UNLOCKED' : 'USER_LOCKED',
      actor,
      user,
      before,
      this.toAuditUser(user),
      context,
    );
    return {
      success: true,
      message: isActive
        ? 'ADMIN_USER_UNLOCK_SUCCEEDED'
        : 'ADMIN_USER_LOCK_SUCCEEDED',
      data: { user: this.toAdminUser(user) },
    };
  }

  private async findUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('ADMIN_USER_NOT_FOUND');
    return user;
  }

  private async findRole(nameRole: RoleName): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { nameRole } });
    if (!role) throw new BadRequestException('ADMIN_ROLE_NOT_FOUND');
    return role;
  }

  private async assertIdentityAvailable(
    email: string,
    userName: string,
    excludeId?: number,
  ) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('(LOWER(user.email) = :email OR LOWER(user.user_name) = :userName)', {
        email: email.toLowerCase(),
        userName: userName.toLowerCase(),
      });
    if (excludeId) query.andWhere('user.id <> :excludeId', { excludeId });
    const duplicate = await query.getOne();
    if (!duplicate) return;
    throw new ConflictException(
      duplicate.email.toLowerCase() === email.toLowerCase()
        ? 'ADMIN_USER_EMAIL_ALREADY_EXISTS'
        : 'ADMIN_USER_USERNAME_ALREADY_EXISTS',
    );
  }

  private async assertAnotherSuperAdminExists(excludedId: number) {
    const count = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .where('role.name_role = :role', { role: RoleName.SuperAdmin })
      .andWhere('user.is_active = 1')
      .andWhere('user.id <> :excludedId', { excludedId })
      .getCount();
    if (count === 0) {
      throw new ConflictException('ADMIN_LAST_SUPER_ADMIN_MUST_REMAIN');
    }
  }

  private recordChange(
    action: string,
    actor: AuthenticatedUser,
    target: User,
    beforeData: Record<string, unknown> | null,
    afterData: Record<string, unknown> | null,
    context: RequestContext,
  ) {
    return this.auditService.record({
      actorId: actor.id,
      actorName: actor.fullName ?? actor.userName,
      actorRole: actor.role,
      action,
      entityType: 'USER',
      entityId: target.id,
      entityLabel: target.email,
      beforeData,
      afterData,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private toAuditUser(user: User): Record<string, unknown> {
    return {
      id: user.id,
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role.nameRole,
      isActive: user.isActive,
    };
  }

  private toAdminUser(user: User) {
    return {
      ...this.toAuditUser(user),
      avatar: user.avatar,
      coverImage: user.coverImage,
      dateOfBirth: user.dateOfBirth,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
