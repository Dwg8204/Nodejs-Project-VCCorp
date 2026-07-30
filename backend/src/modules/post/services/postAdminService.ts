import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { PostStatus } from 'common/enums/database.enums';
import { AuditService } from 'modules/audit/services/audit.service';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';
import { Post } from 'modules/post/models/post';
import { QueryAdminPostDto, RejectPostDto } from '../validations/postValidation';

@Injectable()
export class PostAdminService {
  constructor(
    @InjectRepository(Post) private readonly postRepository: Repository<Post>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: QueryAdminPostDto) {
    const { page = 1, limit = 10, status, authorId, categoryId, search, sort = 'newest' } = query;
    const take = Math.min(limit, 100);
    const qb = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.translations', 'translation')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('category.translations', 'categoryTranslation')
      .loadRelationCountAndMap('post.likesCount', 'post.likes', 'like', (sub) =>
        sub.andWhere('like.isLiked = :liked', { liked: true }))
      .loadRelationCountAndMap('post.commentsCount', 'post.comments', 'comment', (sub) =>
        sub.andWhere('comment.deletedAt IS NULL'))
      .where('post.deletedAt IS NULL');
    if (status) qb.andWhere('post.status = :status', { status });
    if (authorId) qb.andWhere('post.authorId = :authorId', { authorId });
    if (categoryId) qb.andWhere('post.categoryId = :categoryId', { categoryId });
    if (search) qb.andWhere('(translation.title LIKE :search OR author.fullName LIKE :search)', { search: `%${search}%` });
    if (sort === 'oldest') qb.orderBy('post.createdAt', 'ASC');
    else if (sort === 'title-asc') qb.orderBy('translation.title', 'ASC');
    else if (sort === 'title-desc') qb.orderBy('translation.title', 'DESC');
    else qb.orderBy('post.createdAt', 'DESC');
    qb.addOrderBy('post.id', 'DESC');
    const [posts, total] = await qb.skip((page - 1) * take).take(take).getManyAndCount();
    const items = posts.map(({ author, ...post }) => ({
      ...post,
      author: author ? { id: author.id, fullName: author.fullName, userName: author.userName, avatar: author.avatar } : null,
    }));
    return { success: true, data: { items, pagination: { page, limit: take, total, totalPages: Math.ceil(total / take) } } };
  }

  async findOne(postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
      relations: ['translations', 'translations.language', 'category', 'category.translations', 'author', 'reviewer'],
    });
    if (!post) throw this.notFound();
    const { author, reviewer, ...rest } = post;
    return { success: true, data: { item: {
      ...rest,
      author: author ? { id: author.id, fullName: author.fullName, userName: author.userName, avatar: author.avatar } : null,
      reviewer: reviewer ? { id: reviewer.id, fullName: reviewer.fullName } : null,
    } } };
  }

  approve(user: AuthenticatedUser, postId: string, ip: string, agent?: string) {
    return this.review(user, postId, PostStatus.Published, undefined, ip, agent);
  }

  reject(user: AuthenticatedUser, postId: string, dto: RejectPostDto, ip: string, agent?: string) {
    return this.review(user, postId, PostStatus.Rejected, dto.reason, ip, agent);
  }

  private async review(user: AuthenticatedUser, id: string, status: PostStatus, reason: string | undefined, ip: string, agent?: string) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Post);
      const post = await repo.findOne({ where: { id, deletedAt: IsNull() }, relations: ['translations'] });
      if (!post) throw this.notFound();
      if (post.status !== PostStatus.Pending) {
        throw new BadRequestException({ code: 'POST_NOT_PENDING', message: 'Post is not pending approval' });
      }
      const before = structuredClone(post);
      post.status = status;
      post.rejectionReason = reason ?? null;
      post.reviewedBy = user.id;
      post.reviewedAt = new Date();
      post.publishedAt = status === PostStatus.Published ? new Date() : null;
      await repo.save(post);
      const action = status === PostStatus.Published ? 'POST_APPROVED' : 'POST_REJECTED';
      await this.record(manager, user, action, post, before, post, ip, agent, reason);
      return { success: true, message: action, data: { item: post } };
    });
  }

  private record(manager: EntityManager, user: AuthenticatedUser, action: string, post: Post, before: unknown, after: unknown, ip: string, agent?: string, reason?: string) {
    return this.auditService.record({
      actorId: user.id, actorName: user.fullName ?? user.userName, actorRole: user.role,
      action, entityType: 'POST', entityId: post.id,
      entityLabel: post.translations?.[0]?.title ?? `#${post.id}`,
      beforeData: before as never, afterData: after as never,
      metadata: reason ? { reason } : undefined, ipAddress: ip, userAgent: agent,
    }, manager);
  }

  private notFound() {
    return new NotFoundException({ code: 'POST_NOT_FOUND', message: 'Post not found' });
  }
}
