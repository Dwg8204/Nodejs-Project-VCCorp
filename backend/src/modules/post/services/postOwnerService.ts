import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { PostStatus } from 'common/enums/database.enums';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';
import { AuditService } from 'modules/audit/services/audit.service';
import { Category } from 'modules/category/models/category';
import { Language } from 'modules/language/models/language';
import { Post } from 'modules/post/models/post';
import { PostTranslation } from 'modules/post/models/postTranslation';
import {
  CreatePostDto,
  QueryOwnerPostDto,
  TranslationItemDto,
  UpdatePostDto,
} from '../validations/postValidation';

@Injectable()
export class PostOwnerService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(userId: number, query: QueryOwnerPostDto) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sort = 'newest',
    } = query;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.translations', 'translation')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('category.translations', 'categoryTranslation')
      .where('post.authorId = :userId', { userId })
      .andWhere('post.deletedAt IS NULL');

    if (status) queryBuilder.andWhere('post.status = :status', { status });
    if (search) {
      queryBuilder.andWhere(
        '(translation.title LIKE :search OR categoryTranslation.name LIKE :search)',
        { search: `%${search}%` },
      );
    }
    this.applySort(queryBuilder, sort);

    const [posts, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();
    const rawStats = await this.postRepository
      .createQueryBuilder('post')
      .select('post.status', 'status')
      .addSelect('COUNT(post.id)', 'total')
      .where('post.authorId = :userId', { userId })
      .andWhere('post.deletedAt IS NULL')
      .groupBy('post.status')
      .getRawMany<{ status: PostStatus; total: string }>();
    const byStatus = Object.fromEntries(
      Object.values(PostStatus).map((value) => [value, 0]),
    ) as Record<PostStatus, number>;
    for (const row of rawStats) byStatus[row.status] = Number(row.total);

    return {
      success: true,
      data: {
        items: posts,
        stats: {
          total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
          ...byStatus,
        },
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    };
  }

  async findOne(userId: number, postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, authorId: userId, deletedAt: IsNull() },
      relations: ['translations', 'category', 'category.translations'],
    });
    if (!post) throw this.notFound();
    return { success: true, data: { item: post } };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreatePostDto,
    ipAddress: string,
    userAgent?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      await this.validateReferences(manager, dto.categoryId, dto.sourceLanguageId, dto.translations);
      const postRepository = manager.getRepository(Post);
      const translationRepository = manager.getRepository(PostTranslation);
      const post = await postRepository.save(postRepository.create({
        authorId: user.id,
        categoryId: dto.categoryId,
        sourceLanguageId: dto.sourceLanguageId ?? null,
        thumbnail: dto.thumbnail,
        status: PostStatus.Draft,
      }));
      const translations = await translationRepository.save(
        dto.translations.map((translation) =>
          translationRepository.create({
            postId: post.id,
            languageId: translation.languageId,
            title: translation.title.trim(),
            content: translation.content,
            isAutoTranslated: translation.isAutoTranslated ?? false,
          }),
        ),
      );
      const item = { ...post, translations };
      await this.record(
        manager,
        user,
        'POST_CREATED',
        post,
        null,
        item,
        dto.translations[0]?.title,
        ipAddress,
        userAgent,
      );
      return { success: true, message: 'POST_CREATED', data: { item } };
    });
  }

  async update(
    user: AuthenticatedUser,
    postId: string,
    dto: UpdatePostDto,
    ipAddress: string,
    userAgent?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Post);
      const translationRepository = manager.getRepository(PostTranslation);
      const post = await repository.findOne({
        where: { id: postId, authorId: user.id, deletedAt: IsNull() },
        relations: ['translations'],
      });
      if (!post) throw this.notFound();
      if (![PostStatus.Draft, PostStatus.Rejected].includes(post.status)) {
        throw new ForbiddenException({
          code: 'POST_CANNOT_EDIT',
          message: 'Only DRAFT or REJECTED posts can be edited',
        });
      }
      const before = structuredClone(post);
      const categoryId = dto.categoryId ?? post.categoryId;
      const sourceLanguageId =
        dto.sourceLanguageId === undefined
          ? post.sourceLanguageId ?? undefined
          : dto.sourceLanguageId;
      const translations = dto.translations ?? post.translations;
      await this.validateReferences(
        manager,
        categoryId,
        sourceLanguageId,
        translations,
      );
      if (dto.thumbnail !== undefined) post.thumbnail = dto.thumbnail;
      post.categoryId = categoryId;
      post.sourceLanguageId = sourceLanguageId ?? null;
      post.rejectionReason = null;
      await repository.save(post);

      if (dto.translations) {
        await translationRepository.delete({ postId });
        post.translations = await translationRepository.save(
          dto.translations.map((translation) =>
            translationRepository.create({
              postId,
              languageId: translation.languageId,
              title: translation.title.trim(),
              content: translation.content,
              isAutoTranslated: translation.isAutoTranslated ?? false,
            }),
          ),
        );
      }
      await this.record(
        manager,
        user,
        'POST_UPDATED',
        post,
        before,
        post,
        post.translations?.[0]?.title,
        ipAddress,
        userAgent,
      );
      return { success: true, message: 'POST_UPDATED', data: { item: post } };
    });
  }

  async softDelete(
    user: AuthenticatedUser,
    postId: string,
    ipAddress: string,
    userAgent?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Post);
      const post = await repository.findOne({
        where: { id: postId, authorId: user.id, deletedAt: IsNull() },
        relations: ['translations'],
      });
      if (!post) throw this.notFound();
      const before = structuredClone(post);
      post.deletedAt = new Date();
      await repository.save(post);
      await this.record(
        manager,
        user,
        'POST_DELETED',
        post,
        before,
        post,
        post.translations?.[0]?.title,
        ipAddress,
        userAgent,
      );
      return { success: true, message: 'POST_DELETED' };
    });
  }

  async submit(
    user: AuthenticatedUser,
    postId: string,
    ipAddress: string,
    userAgent?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Post);
      const post = await repository.findOne({
        where: { id: postId, authorId: user.id, deletedAt: IsNull() },
        relations: ['translations'],
      });
      if (!post) throw this.notFound();
      if (![PostStatus.Draft, PostStatus.Rejected].includes(post.status)) {
        throw new BadRequestException({
          code:
            post.status === PostStatus.Pending
              ? 'POST_ALREADY_SUBMITTED'
              : 'POST_ALREADY_PUBLISHED',
          message: 'Only DRAFT or REJECTED posts can be submitted',
        });
      }
      if (!post.translations.length) {
        throw new BadRequestException({
          code: 'POST_TRANSLATION_REQUIRED',
          message: 'At least one translation is required',
        });
      }
      const before = structuredClone(post);
      post.status = PostStatus.Pending;
      post.submittedAt = new Date();
      post.rejectionReason = null;
      await repository.save(post);
      await this.record(
        manager,
        user,
        'POST_SUBMITTED',
        post,
        before,
        post,
        post.translations[0]?.title,
        ipAddress,
        userAgent,
      );
      return { success: true, message: 'POST_SUBMITTED', data: { item: post } };
    });
  }

  private applySort(
    queryBuilder: ReturnType<Repository<Post>['createQueryBuilder']>,
    sort: NonNullable<QueryOwnerPostDto['sort']>,
  ): void {
    if (sort === 'oldest') queryBuilder.orderBy('post.createdAt', 'ASC');
    else if (sort === 'title-asc') queryBuilder.orderBy('translation.title', 'ASC');
    else if (sort === 'title-desc') queryBuilder.orderBy('translation.title', 'DESC');
    else queryBuilder.orderBy('post.createdAt', 'DESC');
    queryBuilder.addOrderBy('post.id', 'DESC');
  }

  private async validateReferences(
    manager: EntityManager,
    categoryId: number,
    sourceLanguageId: number | undefined,
    translations: TranslationItemDto[],
  ): Promise<void> {
    const category = await manager.getRepository(Category).findOne({
      where: { id: categoryId, deletedAt: IsNull() },
    });
    if (!category) {
      throw new BadRequestException({
        code: 'POST_CATEGORY_INVALID',
        message: 'Category does not exist or has been deleted',
      });
    }
    const languageIds = translations.map((item) => item.languageId);
    if (new Set(languageIds).size !== languageIds.length) {
      throw new BadRequestException({
        code: 'POST_TRANSLATION_LANGUAGE_DUPLICATED',
        message: 'Each language can appear only once',
      });
    }
    if (sourceLanguageId && !languageIds.includes(sourceLanguageId)) {
      throw new BadRequestException({
        code: 'POST_SOURCE_TRANSLATION_REQUIRED',
        message: 'A translation for the source language is required',
      });
    }
    const activeLanguages = await manager
      .getRepository(Language)
      .createQueryBuilder('language')
      .where('language.id IN (:...ids)', { ids: languageIds })
      .andWhere('language.isActive = :active', { active: true })
      .andWhere('language.deletedAt IS NULL')
      .getCount();
    if (activeLanguages !== languageIds.length) {
      throw new BadRequestException({
        code: 'POST_LANGUAGE_INVALID',
        message: 'One or more languages are inactive or do not exist',
      });
    }
  }

  private async record(
    manager: EntityManager,
    user: AuthenticatedUser,
    action: string,
    post: Post,
    beforeData: unknown,
    afterData: unknown,
    entityLabel: string | undefined,
    ipAddress: string,
    userAgent?: string,
  ): Promise<void> {
    await this.auditService.record({
      actorId: user.id,
      actorName: user.fullName ?? user.userName,
      actorRole: user.role,
      action,
      entityType: 'POST',
      entityId: post.id,
      entityLabel: entityLabel ?? `#${post.id}`,
      beforeData: beforeData as never,
      afterData: afterData as never,
      ipAddress,
      userAgent,
    }, manager);
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: 'POST_NOT_FOUND',
      message: 'Post not found or you do not have permission',
    });
  }
}
