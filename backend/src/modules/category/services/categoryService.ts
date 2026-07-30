import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { AuditService } from 'modules/audit/services/audit.service';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';
import { Language } from 'modules/language/models/language';
import { Category } from '../models/category';
import { CategoryTranslation } from '../models/categoryTranslation';
import { CreateCategoryDto, QueryCategoryDto, TranslationItemDto, UpdateCategoryDto } from '../validations/categoryValidation';
import { AppCacheService } from 'modules/cache/cache.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly cache: AppCacheService,
  ) {}

  create(user: AuthenticatedUser, dto: CreateCategoryDto, ip: string, agent?: string) {
    return this.dataSource.transaction(async (manager) => {
      await this.validate(manager, dto.sourceLanguageId, dto.translations);
      const repo = manager.getRepository(Category);
      const translationRepo = manager.getRepository(CategoryTranslation);
      const category = await repo.save(repo.create({ sourceLanguageId: dto.sourceLanguageId }));
      category.translations = await translationRepo.save(dto.translations.map((item) =>
        translationRepo.create({ categoryId: category.id, languageId: item.languageId, name: item.name.trim(), des: item.des ?? null, isAutoTranslated: item.isAutoTranslated ?? false })));
      await this.log(manager, user, 'CATEGORY_CREATED', category, null, category, ip, agent);
      return { success: true, message: 'CATEGORY_CREATED', data: { item: category } };
    }).then(async (result) => {
      await this.cache.invalidatePrefix('categories:');
      return result;
    });
  }

  async findAll(query: QueryCategoryDto) {
    const key = `categories:list:${JSON.stringify(query)}`;
    return this.cache.getOrSet(key, 300, () => this.findAllUncached(query));
  }

  private async findAllUncached(query: QueryCategoryDto) {
    const { page = 1, limit = 10, search, language, sort = 'newest' } = query;
    const take = Math.min(limit, 100);
    const idQuery = this.categoryRepository.createQueryBuilder('category')
      .select('category.id', 'id')
      .where('category.deletedAt IS NULL');
    if (search) {
      const matchQuery = this.dataSource.getRepository(CategoryTranslation)
        .createQueryBuilder('searchTranslation')
        .select('DISTINCT searchTranslation.categoryId', 'categoryId')
        .innerJoin('searchTranslation.language', 'searchLanguage')
        .innerJoin('searchTranslation.category', 'searchCategory')
        .where('searchCategory.deletedAt IS NULL')
        .andWhere('searchTranslation.name LIKE :search', { search: `%${search.trim()}%` });
      if (language) {
        matchQuery.andWhere('searchLanguage.code = :language', { language });
      }
      const matchingIds = (await matchQuery.getRawMany<{ categoryId: string }>())
        .map((row) => Number(row.categoryId));
      if (!matchingIds.length) {
        return { success: true, data: { items: [], pagination: { page, limit: take, total: 0, totalPages: 0 } } };
      }
      idQuery.andWhere('category.id IN (:...matchingIds)', { matchingIds });
    }
    const total = await idQuery.clone().getCount();
    if (sort === 'oldest') idQuery.orderBy('category.createdAt', 'ASC');
    else if (sort === 'name-asc' || sort === 'name-desc') {
      idQuery.addSelect((subQuery) => {
        const queryBuilder = subQuery
          .select('sortTranslation.name')
          .from(CategoryTranslation, 'sortTranslation')
          .innerJoin(Language, 'sortLanguage', 'sortLanguage.id = sortTranslation.languageId')
          .where('sortTranslation.categoryId = category.id');
        if (language) queryBuilder.andWhere('sortLanguage.code = :language');
        return queryBuilder.limit(1);
      }, 'sortName').orderBy('sortName', sort === 'name-asc' ? 'ASC' : 'DESC');
      if (language) idQuery.setParameter('language', language);
    } else idQuery.orderBy('category.createdAt', 'DESC');
    idQuery.addOrderBy('category.id', 'DESC');
    const idRows = await idQuery.offset((page - 1) * take).limit(take).getRawMany<{ id: string }>();
    const ids = idRows.map((row) => Number(row.id));
    if (!ids.length) {
      return { success: true, data: { items: [], pagination: { page, limit: take, total, totalPages: Math.ceil(total / take) } } };
    }
    const items = await this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translation')
      .leftJoinAndSelect('translation.language', 'languageEntity')
      .loadRelationCountAndMap('category.postsCount', 'category.posts', 'post', (sub) => sub.andWhere('post.deletedAt IS NULL'))
      .where({ id: In(ids) })
      .getMany();
    const position = new Map(ids.map((id, index) => [id, index]));
    items.sort((left, right) => (position.get(left.id) ?? 0) - (position.get(right.id) ?? 0));
    return { success: true, data: { items, pagination: { page, limit: take, total, totalPages: Math.ceil(total / take) } } };
  }

  async findOne(id: number) {
    const item = await this.categoryRepository.findOne({ where: { id, deletedAt: IsNull() }, relations: ['translations', 'translations.language'] });
    if (!item) throw this.notFound();
    return { success: true, data: { item } };
  }

  update(user: AuthenticatedUser, id: number, dto: UpdateCategoryDto, ip: string, agent?: string) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Category);
      const translationsRepo = manager.getRepository(CategoryTranslation);
      const category = await repo.findOne({ where: { id, deletedAt: IsNull() }, relations: ['translations'] });
      if (!category) throw this.notFound();
      const before = structuredClone(category);
      const sourceLanguageId = dto.sourceLanguageId ?? category.sourceLanguageId;
      const translations = dto.translations ?? category.translations;
      if (!sourceLanguageId) throw new BadRequestException({ code: 'CATEGORY_SOURCE_LANGUAGE_REQUIRED' });
      await this.validate(manager, sourceLanguageId, translations, id);
      category.sourceLanguageId = sourceLanguageId;
      await repo.save(category);
      if (dto.translations) {
        await translationsRepo.delete({ categoryId: id });
        category.translations = await translationsRepo.save(dto.translations.map((item) =>
          translationsRepo.create({ categoryId: id, languageId: item.languageId, name: item.name.trim(), des: item.des ?? null, isAutoTranslated: item.isAutoTranslated ?? false })));
      }
      await this.log(manager, user, 'CATEGORY_UPDATED', category, before, category, ip, agent);
      return { success: true, message: 'CATEGORY_UPDATED', data: { item: category } };
    }).then(async (result) => {
      await this.cache.invalidatePrefix('categories:');
      return result;
    });
  }

  softDelete(user: AuthenticatedUser, id: number, ip: string, agent?: string) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Category);
      const category = await repo.findOne({ where: { id, deletedAt: IsNull() }, relations: ['translations'] });
      if (!category) throw this.notFound();
      const before = structuredClone(category);
      category.deletedAt = new Date();
      await repo.save(category);
      await this.log(manager, user, 'CATEGORY_DELETED', category, before, category, ip, agent);
      return { success: true, message: 'CATEGORY_DELETED' };
    }).then(async (result) => {
      await this.cache.invalidatePrefix('categories:');
      return result;
    });
  }

  async restore(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw this.notFound();
    if (!category.deletedAt) throw new ConflictException({ code: 'CATEGORY_NOT_DELETED' });
    category.deletedAt = null;
    const item = await this.categoryRepository.save(category);
    await this.cache.invalidatePrefix('categories:');
    return { success: true, message: 'CATEGORY_RESTORED', data: { item } };
  }

  private async validate(manager: EntityManager, sourceId: number, translations: TranslationItemDto[], excludeCategoryId?: number) {
    const ids = translations.map((item) => item.languageId);
    if (new Set(ids).size !== ids.length) throw new ConflictException({ code: 'CATEGORY_LANGUAGE_DUPLICATED' });
    if (!ids.includes(sourceId)) throw new BadRequestException({ code: 'CATEGORY_SOURCE_TRANSLATION_REQUIRED' });
    const count = await manager.getRepository(Language).createQueryBuilder('language')
      .where('language.id IN (:...ids)', { ids }).andWhere('language.isActive = 1')
      .andWhere('language.deletedAt IS NULL').getCount();
    if (count !== ids.length) throw new BadRequestException({ code: 'CATEGORY_LANGUAGE_INVALID' });
    const duplicateQuery = manager.getRepository(CategoryTranslation)
      .createQueryBuilder('translation')
      .innerJoin('translation.category', 'category')
      .where('category.deletedAt IS NULL');
    if (excludeCategoryId) {
      duplicateQuery.andWhere('translation.categoryId != :excludeCategoryId', { excludeCategoryId });
    }
    duplicateQuery.andWhere(
      translations.map((_, index) =>
        `(translation.languageId = :language${index} AND LOWER(TRIM(translation.name)) = :name${index})`,
      ).join(' OR '),
      Object.fromEntries(translations.flatMap((item, index) => [
        [`language${index}`, item.languageId],
        [`name${index}`, item.name.trim().toLocaleLowerCase()],
      ])),
    );
    const duplicate = await duplicateQuery.getOne();
    if (duplicate) {
      throw new ConflictException({
        code: 'CATEGORY_NAME_ALREADY_EXISTS',
        message: 'A category with this name already exists in one of the selected languages',
        languageId: duplicate.languageId,
        name: duplicate.name,
      });
    }
  }

  private log(manager: EntityManager, user: AuthenticatedUser, action: string, category: Category, before: unknown, after: unknown, ip: string, agent?: string) {
    return this.auditService.record({
      actorId: user.id, actorName: user.fullName ?? user.userName, actorRole: user.role,
      action, entityType: 'CATEGORY', entityId: String(category.id),
      entityLabel: category.translations?.[0]?.name ?? `#${category.id}`,
      beforeData: before as never, afterData: after as never, ipAddress: ip, userAgent: agent,
    }, manager);
  }

  private notFound() {
    return new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
  }
}
