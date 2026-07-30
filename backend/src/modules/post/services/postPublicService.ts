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
    const {
      page = 1,
      limit = 10,
      language,
      categoryId,
      authorId,
      search,
      sort = 'newest',
    } = query;
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

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    if (search) {
      queryBuilder.andWhere('translation.title LIKE :search', { search: `%${search}%` });
    }

    // Subqueries for likes and comments count
    queryBuilder.loadRelationCountAndMap(
      'post.likesCount',
      'post.likes',
      'activeLike',
      (likes) => likes.andWhere('activeLike.isLiked = :liked', { liked: true }),
    );
    queryBuilder.loadRelationCountAndMap(
      'post.commentsCount',
      'post.comments',
      'activeComment',
      (comments) => comments.andWhere('activeComment.deletedAt IS NULL'),
    );

    if (sort === 'oldest') {
      queryBuilder.orderBy('post.publishedAt', 'ASC');
    } else if (sort === 'popular') {
      queryBuilder.addSelect((subQuery) => {
        return subQuery
          .select('COUNT(likes.id)', 'likesCountAlias')
          .from('post_likes', 'likes')
          .where('likes.post_id = post.id')
          .andWhere('likes.is_liked = 1');
      }, 'likesCountAlias');
      queryBuilder.addSelect((subQuery) => subQuery
        .select('COUNT(comments.id)', 'commentsCountAlias')
        .from('comments', 'comments')
        .where('comments.post_id = post.id')
        .andWhere('comments.deleted_at IS NULL'), 'commentsCountAlias');
      queryBuilder.addSelect(
        '(SELECT COUNT(*) FROM post_likes popularity_likes WHERE popularity_likes.post_id = post.id AND popularity_likes.is_liked = 1) + '
        + '(SELECT COUNT(*) FROM comments popularity_comments WHERE popularity_comments.post_id = post.id AND popularity_comments.deleted_at IS NULL)',
        'interactionCountAlias',
      );
      queryBuilder.orderBy('interactionCountAlias', 'DESC');
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
          userName: author.userName,
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

    queryBuilder.loadRelationCountAndMap(
      'post.likesCount',
      'post.likes',
      'activeLike',
      (likes) => likes.andWhere('activeLike.isLiked = :liked', { liked: true }),
    );
    queryBuilder.loadRelationCountAndMap(
      'post.commentsCount',
      'post.comments',
      'activeComment',
      (comments) => comments.andWhere('activeComment.deletedAt IS NULL'),
    );

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
        userName: author.userName,
        avatar: author.avatar,
      } : null
    };

    return {
      success: true,
      data: { item: mappedPost },
    };
  }
}
