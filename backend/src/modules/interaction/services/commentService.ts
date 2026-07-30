import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from 'modules/interaction/models/comment';
import { Post } from 'modules/post/models/post';
import { PostStatus } from 'common/enums/database.enums';
import { CreateCommentDto, QueryCommentDto } from '../validations/interactionValidation';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findByPost(postId: string, query: QueryCommentDto) {
    const { page = 1, limit = 20 } = query;
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.deletedAt IS NULL');
    queryBuilder
      .orderBy('comment.createdAt', 'ASC')
      .addOrderBy('comment.id', 'ASC');

    const [comments, total] = await queryBuilder.skip(skip).take(take).getManyAndCount();

    const mappedComments = comments.map(comment => {
      const { user, ...rest } = comment;
      return {
        ...rest,
        user: user ? {
          id: user.id,
          fullName: user.fullName,
          avatar: user.avatar,
        } : null
      };
    });

    return {
      success: true,
      data: {
        items: mappedComments,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    };
  }

  async create(userId: number, postId: string, dto: CreateCommentDto) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: null },
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found' }
      });
    }

    if (post.status !== PostStatus.Published) {
      throw new BadRequestException({
        success: false,
        error: { code: 'POST_NOT_PUBLISHED', message: 'Cannot comment on an unpublished post' }
      });
    }

    if (dto.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentId, postId, deletedAt: null },
      });

      if (!parentComment) {
        throw new NotFoundException({
          success: false,
          error: { code: 'PARENT_COMMENT_NOT_FOUND', message: 'Parent comment not found' }
        });
      }
    }

    const comment = this.commentRepository.create({
      userId,
      postId,
      parentId: dto.parentId ?? null,
      content: dto.content,
    });

    await this.commentRepository.save(comment);

    return {
      success: true,
      message: 'COMMENT_CREATED',
      data: { item: comment },
    };
  }
}
