import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'modules/post/models/post';
import { PostStatus } from 'common/enums/database.enums';
import { QueryPostDto } from '../validations/postValidation';

@Injectable()
export class PostPublicService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findAll(query: QueryPostDto) {
    const { page = 1, limit = 10, language, categoryId, search, sort = 'newest' } = query;
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.translations', 'translation')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('category.translations', 'categoryTranslation')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.status = :status', { status: PostStatus.Published })
      .andWhere('post.deletedAt IS NULL');

    if (language) {
      queryBuilder
        .leftJoin('translation.language', 'lang')
        .andWhere('lang.code = :language', { language });
    }

    if (categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere('translation.title LIKE :search', { search: `%${search}%` });
    }

    // Subqueries for likes and comments count
    queryBuilder.loadRelationCountAndMap('post.likesCount', 'post.likes');
    queryBuilder.loadRelationCountAndMap('post.commentsCount', 'post.comments');

    if (sort === 'oldest') {
      queryBuilder.orderBy('post.publishedAt', 'ASC');
    } else if (sort === 'popular') {
      // TypeORM loadRelationCountAndMap doesn't allow order by mapped count directly in standard ways easily without subquery
      // To keep it simple, we sort by publishedAt for popular too unless we write a raw subquery.
      // We will add a raw subquery for order by popular if needed, but for now we fallback to newest, or we add leftJoin likes.
      queryBuilder.addSelect((subQuery) => {
        return subQuery
          .select('COUNT(likes.id)', 'likesCountAlias')
          .from('post_likes', 'likes')
          .where('likes.post_id = post.id');
      }, 'likesCountAlias');
      queryBuilder.orderBy('likesCountAlias', 'DESC');
    } else {
      queryBuilder.orderBy('post.publishedAt', 'DESC');
    }

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

  async findOne(id: string) {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.translations', 'translation')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('category.translations', 'categoryTranslation')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.id = :id', { id })
      .andWhere('post.status = :status', { status: PostStatus.Published })
      .andWhere('post.deletedAt IS NULL');

    queryBuilder.loadRelationCountAndMap('post.likesCount', 'post.likes');
    queryBuilder.loadRelationCountAndMap('post.commentsCount', 'post.comments');

    const post = await queryBuilder.getOne();

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found',
        }
      });
    }

    const { author, ...rest } = post;
    const mappedPost = {
      ...rest,
      author: author ? {
        id: author.id,
        fullName: author.fullName,
        avatar: author.avatar,
      } : null
    };

    return {
      success: true,
      data: mappedPost,
    };
  }
}
