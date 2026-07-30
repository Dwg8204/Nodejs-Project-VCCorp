import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'modules/post/models/post';
import { PostTranslation } from 'modules/post/models/postTranslation';
import { PostStatus } from 'common/enums/database.enums';
import { CreatePostDto, UpdatePostDto, QueryOwnerPostDto } from '../validations/postValidation';

@Injectable()
export class PostOwnerService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostTranslation)
    private readonly translationRepository: Repository<PostTranslation>,
  ) {}

  async findAll(userId: number, query: QueryOwnerPostDto) {
    const { page = 1, limit = 10, status, search } = query;
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.translations', 'translation')
      .where('post.authorId = :userId', { userId })
      .andWhere('post.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere('translation.title LIKE :search', { search: `%${search}%` });
    }

    queryBuilder.orderBy('post.createdAt', 'DESC');

    const [posts, total] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    return {
      success: true,
      data: {
        items: posts,
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
      where: { id: postId, authorId: userId, deletedAt: null },
      relations: ['translations', 'category', 'category.translations'],
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found or you do not have permission',
        }
      });
    }

    return {
      success: true,
      data: post,
    };
  }

  async create(userId: number, dto: CreatePostDto) {
    // Create the post as DRAFT
    const post = this.postRepository.create({
      authorId: userId,
      categoryId: dto.categoryId,
      sourceLanguageId: dto.sourceLanguageId ?? null,
      thumbnail: dto.thumbnail,
      status: PostStatus.Draft,
    });

    await this.postRepository.save(post);

    const translations = dto.translations.map(t => 
      this.translationRepository.create({
        postId: post.id,
        languageId: t.languageId,
        title: t.title,
        content: t.content,
      })
    );

    await this.translationRepository.save(translations);

    const savedPost = await this.postRepository.findOne({
      where: { id: post.id },
      relations: ['translations'],
    });

    return {
      success: true,
      message: 'POST_CREATED',
      data: savedPost,
    };
  }

  async update(userId: number, postId: string, dto: UpdatePostDto) {
    const post = await this.postRepository.findOne({
      where: { id: postId, authorId: userId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
      });
    }

    if (post.status !== PostStatus.Draft && post.status !== PostStatus.Rejected) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'POST_CANNOT_EDIT', message: 'Only DRAFT or REJECTED posts can be edited' }
      });
    }

    if (dto.thumbnail) post.thumbnail = dto.thumbnail;
    if (dto.categoryId) post.categoryId = dto.categoryId;
    if (dto.sourceLanguageId !== undefined) post.sourceLanguageId = dto.sourceLanguageId;

    await this.postRepository.save(post);

    if (dto.translations && dto.translations.length > 0) {
      await this.translationRepository.delete({ postId });
      
      const newTranslations = dto.translations.map(t => 
        this.translationRepository.create({
          postId: post.id,
          languageId: t.languageId,
          title: t.title,
          content: t.content,
        })
      );
      
      await this.translationRepository.save(newTranslations);
    }

    const updatedPost = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['translations'],
    });

    return {
      success: true,
      message: 'POST_UPDATED',
      data: updatedPost,
    };
  }

  async softDelete(userId: number, postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, authorId: userId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
      });
    }

    post.deletedAt = new Date();
    await this.postRepository.save(post);

    return {
      success: true,
      message: 'POST_DELETED',
    };
  }

  async submit(userId: number, postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, authorId: userId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
      });
    }

    if (post.status === PostStatus.Pending) {
      throw new BadRequestException({
        success: false,
        error: { code: 'POST_ALREADY_SUBMITTED', message: 'Post is already waiting for approval' }
      });
    }

    if (post.status === PostStatus.Published) {
      throw new BadRequestException({
        success: false,
        error: { code: 'POST_ALREADY_PUBLISHED', message: 'Post is already published' }
      });
    }

    post.status = PostStatus.Pending;
    post.submittedAt = new Date();
    await this.postRepository.save(post);

    return {
      success: true,
      message: 'POST_SUBMITTED',
      data: post,
    };
  }
}
