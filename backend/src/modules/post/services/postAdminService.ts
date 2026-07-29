import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'modules/post/models/post';
import { PostStatus } from 'common/enums/database.enums';
import { QueryAdminPostDto, RejectPostDto } from '../validations/postValidation';
import { AuditService } from 'modules/audit/services/audit.service';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';

@Injectable()
export class PostAdminService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: QueryAdminPostDto) {
    const { page = 1, limit = 10, status, authorId, categoryId, search } = query;
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.translations', 'translation')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('category.translations', 'categoryTranslation')
      .where('post.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    if (categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere('translation.title LIKE :search', { search: `%${search}%` });
    }

    queryBuilder.orderBy('post.createdAt', 'DESC');

    const [posts, total] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    // Map authors to safe user representation
    const mappedPosts = posts.map(post => {
      const { author, ...rest } = post;
      return {
        ...rest,
        author: author ? {
          id: author.id,
          fullName: author.fullName,
          avatar: author.avatar,
        } : null
      };
    });

    return {
      success: true,
      data: {
        items: mappedPosts,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    };
  }

  async findOne(postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: null },
      relations: ['translations', 'category', 'category.translations', 'author', 'reviewer'],
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
      });
    }

    const { author, reviewer, ...rest } = post;
    const mappedPost = {
      ...rest,
      author: author ? {
        id: author.id,
        fullName: author.fullName,
        avatar: author.avatar,
      } : null,
      reviewer: reviewer ? {
        id: reviewer.id,
        fullName: reviewer.fullName,
      } : null,
    };

    return {
      success: true,
      data: mappedPost,
    };
  }

  async approve(adminUser: AuthenticatedUser, postId: string, ipAddress: string, userAgent?: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
      });
    }

    if (post.status !== PostStatus.Pending) {
      throw new BadRequestException({
        success: false,
        error: { code: 'POST_NOT_PENDING', message: 'Post is not pending approval' }
      });
    }

    post.status = PostStatus.Published;
    post.reviewedBy = adminUser.id;
    post.reviewedAt = new Date();
    post.publishedAt = new Date();

    await this.postRepository.save(post);

    await this.auditService.record({
      actorId: adminUser.id,
      actorName: adminUser.userName,
      actorRole: adminUser.role,
      action: 'POST_APPROVED',
      entityType: 'POST',
      entityId: post.id,
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'POST_APPROVED',
      data: post,
    };
  }

  async reject(adminUser: AuthenticatedUser, postId: string, dto: RejectPostDto, ipAddress: string, userAgent?: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
      });
    }

    if (post.status !== PostStatus.Pending) {
      throw new BadRequestException({
        success: false,
        error: { code: 'POST_NOT_PENDING', message: 'Post is not pending approval' }
      });
    }

    post.status = PostStatus.Rejected;
    post.rejectionReason = dto.reason;
    post.reviewedBy = adminUser.id;
    post.reviewedAt = new Date();

    await this.postRepository.save(post);

    await this.auditService.record({
      actorId: adminUser.id,
      actorName: adminUser.userName,
      actorRole: adminUser.role,
      action: 'POST_REJECTED',
      entityType: 'POST',
      entityId: post.id,
      metadata: { reason: dto.reason },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      message: 'POST_REJECTED',
      data: post,
    };
  }
}
