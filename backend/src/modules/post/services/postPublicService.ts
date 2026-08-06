import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post } from 'modules/post/models/post';
import { PostStatus } from 'common/enums/database.enums';
import { AppCacheService } from 'modules/cache/cache.service';
import { PostLike } from 'modules/interaction/models/postLike';
import { Comment } from 'modules/interaction/models/comment';
import { QueryPostDto } from '../validations/postValidation';

@Injectable()
export class PostPublicService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly dataSource: DataSource,
    private readonly cache: AppCacheService,
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

    const loadBaseList = async () => {
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

      if (sort === 'oldest') {
        queryBuilder.orderBy('post.publishedAt', 'ASC');
      } else if (sort === 'popular') {
        queryBuilder.addSelect(
          '(SELECT COUNT(*) FROM post_likes popularity_likes WHERE popularity_likes.post_id = post.id AND popularity_likes.is_liked = 1) + '
          + '(SELECT COUNT(*) FROM comments popularity_comments WHERE popularity_comments.post_id = post.id AND popularity_comments.deleted_at IS NULL)',
          'interactionCountAlias',
        );
        queryBuilder.orderBy('interactionCountAlias', 'DESC');
      } else {
        queryBuilder.orderBy('post.publishedAt', 'DESC');
      }
      queryBuilder.addOrderBy('post.id', 'DESC');

      const [posts, total] = await queryBuilder.skip(skip).take(take).getManyAndCount();

      const items = posts.map(post => {
        const { author, ...rest } = post;
        return {
          ...rest,
          translations: rest.translations.map(translation => ({
            ...translation,
            content: this.contentPreview(translation.content),
          })),
          author: author ? {
            id: author.id,
            fullName: author.fullName,
            userName: author.userName,
            avatar: author.avatar,
          } : null,
        };
      });
      return {
        items,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    };

    const cacheable = !search && sort !== 'popular';
    const cacheKey = this.listCacheKey({
      page,
      limit: take,
      language,
      categoryId,
      authorId,
      sort,
    });
    const base = cacheable
      ? await this.cache.getOrSet(cacheKey, 300, loadBaseList)
      : await loadBaseList();
    const counts = await this.getInteractionCounts(base.items.map(item => item.id));

    return {
      success: true,
      data: {
        ...base,
        items: base.items.map(item => ({
          ...item,
          likesCount: counts.likes.get(String(item.id)) ?? 0,
          commentsCount: counts.comments.get(String(item.id)) ?? 0,
        })),
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

  private contentPreview(content: string): string {
    const plainText = content
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plainText.length > 320 ? `${plainText.slice(0, 320)}…` : plainText;
  }

  private listCacheKey(query: {
    page: number;
    limit: number;
    language?: string;
    categoryId?: number;
    authorId?: number;
    sort: string;
  }): string {
    return [
      'posts:public:list',
      `page=${query.page}`,
      `limit=${query.limit}`,
      `language=${query.language ?? 'all'}`,
      `category=${query.categoryId ?? 'all'}`,
      `author=${query.authorId ?? 'all'}`,
      `sort=${query.sort}`,
    ].join(':');
  }

  private async getInteractionCounts(postIds: string[]): Promise<{
    likes: Map<string, number>;
    comments: Map<string, number>;
  }> {
    if (!postIds.length) {
      return { likes: new Map(), comments: new Map() };
    }
    const [likeRows, commentRows] = await Promise.all([
      this.dataSource.getRepository(PostLike)
        .createQueryBuilder('like')
        .select('like.postId', 'postId')
        .addSelect('COUNT(like.id)', 'total')
        .where('like.postId IN (:...postIds)', { postIds })
        .andWhere('like.isLiked = :liked', { liked: true })
        .groupBy('like.postId')
        .getRawMany<{ postId: string; total: string }>(),
      this.dataSource.getRepository(Comment)
        .createQueryBuilder('comment')
        .select('comment.postId', 'postId')
        .addSelect('COUNT(comment.id)', 'total')
        .where('comment.postId IN (:...postIds)', { postIds })
        .andWhere('comment.deletedAt IS NULL')
        .groupBy('comment.postId')
        .getRawMany<{ postId: string; total: string }>(),
    ]);
    return {
      likes: new Map(likeRows.map(row => [String(row.postId), Number(row.total)])),
      comments: new Map(commentRows.map(row => [String(row.postId), Number(row.total)])),
    };
  }
}
