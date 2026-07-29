import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LanguageTranslationStatus } from 'common/enums/database.enums';
import { AuditService } from 'modules/audit/services/audit.service';
import {
  AuthenticatedUser,
  RequestContext,
} from 'modules/auth/interfaces/auth-user.interface';
import { Language } from 'modules/language/models/language';
import { Brackets, IsNull, Repository } from 'typeorm';
import {
  ChangeLanguageStatusDto,
  CreateAdminLanguageDto,
  LanguageRecordFilter,
  LanguageSort,
  QueryAdminLanguagesDto,
  UpdateAdminLanguageDto,
} from '../validations/admin-languages.validation';

@Injectable()
export class AdminLanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(dto: QueryAdminLanguagesDto) {
    const query = this.languageRepository
      .createQueryBuilder('language')
      .withDeleted()
      .leftJoinAndSelect('language.fallbackLanguage', 'fallbackLanguage');

    if (dto.records === LanguageRecordFilter.Active) {
      query.andWhere('language.deleted_at IS NULL');
    } else if (dto.records === LanguageRecordFilter.Deleted) {
      query.andWhere('language.deleted_at IS NOT NULL');
    }
    if (dto.search?.trim()) {
      query.andWhere(
        new Brackets((where) => {
          where
            .where('language.code LIKE :search')
            .orWhere('language.name LIKE :search');
        }),
        { search: `%${dto.search.trim()}%` },
      );
    }
    if (dto.translationStatus) {
      query.andWhere('language.translation_status = :translationStatus', {
        translationStatus: dto.translationStatus,
      });
    }
    if (dto.isActive !== undefined) {
      query.andWhere('language.is_active = :isActive', {
        isActive: dto.isActive,
      });
    }

    const sortMap: Record<LanguageSort, [string, 'ASC' | 'DESC']> = {
      [LanguageSort.Newest]: ['language.createdAt', 'DESC'],
      [LanguageSort.Oldest]: ['language.createdAt', 'ASC'],
      [LanguageSort.Ascending]: ['language.name', 'ASC'],
      [LanguageSort.Descending]: ['language.name', 'DESC'],
    };
    const [column, direction] = sortMap[dto.sort];
    query
      .orderBy(column, direction)
      .addOrderBy('language.id', direction)
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    const [languages, total] = await query.getManyAndCount();
    return {
      success: true,
      data: {
        items: languages.map((language) => this.toLanguage(language)),
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
    const language = await this.findLanguage(id, true);
    return { success: true, data: { language: this.toLanguage(language) } };
  }

  async create(
    dto: CreateAdminLanguageDto,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    const code = this.normalizeCode(dto.code);
    await this.assertCodeAvailable(code);
    this.assertStatusPair(dto.isActive, dto.translationStatus);
    const fallback = dto.fallbackLanguageId
      ? await this.findValidFallback(dto.fallbackLanguageId)
      : null;

    const language = this.languageRepository.create({
      code,
      name: dto.name.trim(),
      flag: dto.flag ?? null,
      isActive: dto.isActive,
      isSystemLanguage: false,
      fallbackLanguageId: fallback?.id ?? null,
      fallbackLanguage: fallback,
      translationStatus: dto.translationStatus,
    });
    await this.languageRepository.save(language);
    await this.recordChange(
      'LANGUAGE_CREATED',
      actor,
      language,
      null,
      this.toAuditLanguage(language),
      context,
    );
    return {
      success: true,
      message: 'ADMIN_LANGUAGE_CREATE_SUCCEEDED',
      data: { language: this.toLanguage(language) },
    };
  }

  async update(
    id: number,
    dto: UpdateAdminLanguageDto,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    const language = await this.findLanguage(id);
    const before = this.toAuditLanguage(language);

    if (dto.code !== undefined) {
      const code = this.normalizeCode(dto.code);
      await this.assertCodeAvailable(code, language.id);
      language.code = code;
    }
    if (dto.name !== undefined) language.name = dto.name.trim();
    if (dto.flag !== undefined) language.flag = dto.flag;
    if (dto.fallbackLanguageId !== undefined) {
      if (dto.fallbackLanguageId === null) {
        language.fallbackLanguageId = null;
        language.fallbackLanguage = null;
      } else {
        await this.assertNoFallbackCycle(language.id, dto.fallbackLanguageId);
        const fallback = await this.findValidFallback(dto.fallbackLanguageId);
        language.fallbackLanguageId = fallback.id;
        language.fallbackLanguage = fallback;
      }
    }

    await this.languageRepository.save(language);
    await this.recordChange(
      'LANGUAGE_UPDATED',
      actor,
      language,
      before,
      this.toAuditLanguage(language),
      context,
    );
    return {
      success: true,
      message: 'ADMIN_LANGUAGE_UPDATE_SUCCEEDED',
      data: { language: this.toLanguage(language) },
    };
  }

  async changeStatus(
    id: number,
    dto: ChangeLanguageStatusDto,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    const language = await this.findLanguage(id);
    this.assertStatusPair(dto.isActive, dto.translationStatus);
    if (!dto.isActive) {
      await this.assertCanDeactivate(language);
    }
    const before = this.toAuditLanguage(language);
    language.isActive = dto.isActive;
    language.translationStatus = dto.translationStatus;
    await this.languageRepository.save(language);
    await this.recordChange(
      'LANGUAGE_STATUS_CHANGED',
      actor,
      language,
      before,
      this.toAuditLanguage(language),
      context,
    );
    return {
      success: true,
      message: 'ADMIN_LANGUAGE_STATUS_CHANGE_SUCCEEDED',
      data: { language: this.toLanguage(language) },
    };
  }

  async softDelete(
    id: number,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    const language = await this.findLanguage(id);
    if (language.isSystemLanguage) {
      throw new ConflictException('ADMIN_SYSTEM_LANGUAGE_CANNOT_BE_DELETED');
    }
    await this.assertCanDeactivate(language);
    const before = this.toAuditLanguage(language);
    language.isActive = false;
    language.translationStatus = LanguageTranslationStatus.Disabled;
    language.deletedAt = new Date();
    await this.languageRepository.save(language);
    await this.recordChange(
      'LANGUAGE_DELETED',
      actor,
      language,
      before,
      this.toAuditLanguage(language),
      context,
    );
    return {
      success: true,
      message: 'ADMIN_LANGUAGE_DELETE_SUCCEEDED',
      data: null,
    };
  }

  async restore(
    id: number,
    actor: AuthenticatedUser,
    context: RequestContext,
  ) {
    const language = await this.findLanguage(id, true);
    if (!language.deletedAt) {
      throw new ConflictException('ADMIN_LANGUAGE_NOT_DELETED');
    }
    const before = this.toAuditLanguage(language);
    language.deletedAt = null;
    language.isActive = false;
    language.translationStatus = LanguageTranslationStatus.Draft;
    await this.languageRepository.save(language);
    await this.recordChange(
      'LANGUAGE_RESTORED',
      actor,
      language,
      before,
      this.toAuditLanguage(language),
      context,
    );
    return {
      success: true,
      message: 'ADMIN_LANGUAGE_RESTORE_SUCCEEDED',
      data: { language: this.toLanguage(language) },
    };
  }

  private async findLanguage(id: number, includeDeleted = false) {
    const query = this.languageRepository
      .createQueryBuilder('language')
      .leftJoinAndSelect('language.fallbackLanguage', 'fallbackLanguage')
      .where('language.id = :id', { id });
    if (includeDeleted) query.withDeleted();
    const language = await query.getOne();
    if (!language) throw new NotFoundException('ADMIN_LANGUAGE_NOT_FOUND');
    return language;
  }

  private async findValidFallback(id: number) {
    const fallback = await this.languageRepository.findOne({
      where: { id, deletedAt: IsNull(), isActive: true },
    });
    if (!fallback) {
      throw new BadRequestException('ADMIN_LANGUAGE_FALLBACK_INVALID');
    }
    return fallback;
  }

  private async assertNoFallbackCycle(
    languageId: number,
    fallbackLanguageId: number,
  ) {
    if (languageId === fallbackLanguageId) {
      throw new BadRequestException('ADMIN_LANGUAGE_FALLBACK_SELF_REFERENCE');
    }

    const visited = new Set<number>();
    let currentId: number | null = fallbackLanguageId;
    while (currentId !== null) {
      if (currentId === languageId || visited.has(currentId)) {
        throw new BadRequestException('ADMIN_LANGUAGE_FALLBACK_CYCLE');
      }
      visited.add(currentId);
      const current = await this.languageRepository
        .createQueryBuilder('language')
        .withDeleted()
        .where('language.id = :id', { id: currentId })
        .getOne();
      currentId = current?.fallbackLanguageId ?? null;
    }
  }

  private async assertCodeAvailable(code: string, excludeId?: number) {
    const query = this.languageRepository
      .createQueryBuilder('language')
      .withDeleted()
      .where('LOWER(language.code) = :code', { code: code.toLowerCase() });
    if (excludeId) query.andWhere('language.id <> :excludeId', { excludeId });
    if (await query.getOne()) {
      throw new ConflictException('ADMIN_LANGUAGE_CODE_ALREADY_EXISTS');
    }
  }

  private async assertCanDeactivate(language: Language) {
    const activeCount = await this.languageRepository.count({
      where: { isActive: true, deletedAt: IsNull() },
    });
    if (language.isActive && activeCount <= 1) {
      throw new ConflictException('ADMIN_LAST_ACTIVE_LANGUAGE_MUST_REMAIN');
    }

    const dependentFallbacks = await this.languageRepository.count({
      where: {
        fallbackLanguageId: language.id,
        isActive: true,
        deletedAt: IsNull(),
      },
    });
    if (dependentFallbacks > 0) {
      throw new ConflictException('ADMIN_LANGUAGE_USED_AS_FALLBACK');
    }
  }

  private assertStatusPair(
    isActive: boolean,
    status: LanguageTranslationStatus,
  ) {
    if (
      (isActive && status === LanguageTranslationStatus.Disabled) ||
      (!isActive && status !== LanguageTranslationStatus.Disabled)
    ) {
      throw new BadRequestException('ADMIN_LANGUAGE_STATUS_INCONSISTENT');
    }
  }

  private normalizeCode(code: string) {
    return code.trim().toLowerCase();
  }

  private recordChange(
    action: string,
    actor: AuthenticatedUser,
    language: Language,
    beforeData: Record<string, unknown> | null,
    afterData: Record<string, unknown> | null,
    context: RequestContext,
  ) {
    return this.auditService.record({
      actorId: actor.id,
      actorName: actor.fullName ?? actor.userName,
      actorRole: actor.role,
      action,
      entityType: 'LANGUAGE',
      entityId: language.id,
      entityLabel: `${language.code} - ${language.name}`,
      beforeData,
      afterData,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private toAuditLanguage(language: Language): Record<string, unknown> {
    return {
      id: language.id,
      code: language.code,
      name: language.name,
      flag: language.flag,
      isActive: language.isActive,
      isSystemLanguage: language.isSystemLanguage,
      fallbackLanguageId: language.fallbackLanguageId,
      translationStatus: language.translationStatus,
      deletedAt: language.deletedAt,
    };
  }

  private toLanguage(language: Language) {
    return {
      ...this.toAuditLanguage(language),
      fallbackLanguage: language.fallbackLanguage
        ? {
            id: language.fallbackLanguage.id,
            code: language.fallbackLanguage.code,
            name: language.fallbackLanguage.name,
          }
        : null,
      createdAt: language.createdAt,
      updatedAt: language.updatedAt,
    };
  }
}
