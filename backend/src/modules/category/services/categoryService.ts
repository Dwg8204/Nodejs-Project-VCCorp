import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { AuditService } from 'modules/audit/services/audit.service';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';
import { Language } from 'modules/language/models/language';
import { Category } from '../models/category';
import { CategoryTranslation } from '../models/categoryTranslation';
import { CreateCategoryDto, QueryCategoryDto, TranslationItemDto, UpdateCategoryDto } from '../validations/categoryValidation';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
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
    });
  }

  async findAll(query: QueryCategoryDto) {
    const { page = 1, limit = 10, search, language, sort = 'newest' } = query;
    const take = Math.min(limit, 100);
    const qb = this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translation')
      .leftJoinAndSelect('translation.language', 'languageEntity')
      .loadRelationCountAndMap('category.postsCount', 'category.posts', 'post', (sub) => sub.andWhere('post.deletedAt IS NULL'))
      .where('category.deletedAt IS NULL');
    if (language) qb.andWhere('languageEntity.code = :language', { language });
    if (search) qb.andWhere('translation.name LIKE :search', { search: `%${search}%` });
    if (sort === 'oldest') qb.orderBy('category.createdAt', 'ASC');
    else if (sort === 'name-asc') qb.orderBy('translation.name', 'ASC');
    else if (sort === 'name-desc') qb.orderBy('translation.name', 'DESC');
    else qb.orderBy('category.createdAt', 'DESC');
    qb.addOrderBy('category.id', 'DESC');
    const [items, total] = await qb.skip((page - 1) * take).take(take).getManyAndCount();
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
      await this.validate(manager, sourceLanguageId, translations);
      category.sourceLanguageId = sourceLanguageId;
      await repo.save(category);
      if (dto.translations) {
        await translationsRepo.delete({ categoryId: id });
        category.translations = await translationsRepo.save(dto.translations.map((item) =>
          translationsRepo.create({ categoryId: id, languageId: item.languageId, name: item.name.trim(), des: item.des ?? null, isAutoTranslated: item.isAutoTranslated ?? false })));
      }
      await this.log(manager, user, 'CATEGORY_UPDATED', category, before, category, ip, agent);
      return { success: true, message: 'CATEGORY_UPDATED', data: { item: category } };
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
    });
  }

  async restore(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw this.notFound();
    if (!category.deletedAt) throw new ConflictException({ code: 'CATEGORY_NOT_DELETED' });
    category.deletedAt = null;
    const item = await this.categoryRepository.save(category);
    return { success: true, message: 'CATEGORY_RESTORED', data: { item } };
  }

  private async validate(manager: EntityManager, sourceId: number, translations: TranslationItemDto[]) {
    const ids = translations.map((item) => item.languageId);
    if (new Set(ids).size !== ids.length) throw new ConflictException({ code: 'CATEGORY_LANGUAGE_DUPLICATED' });
    if (!ids.includes(sourceId)) throw new BadRequestException({ code: 'CATEGORY_SOURCE_TRANSLATION_REQUIRED' });
    const count = await manager.getRepository(Language).createQueryBuilder('language')
      .where('language.id IN (:...ids)', { ids }).andWhere('language.isActive = 1')
      .andWhere('language.deletedAt IS NULL').getCount();
    if (count !== ids.length) throw new BadRequestException({ code: 'CATEGORY_LANGUAGE_INVALID' });
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
