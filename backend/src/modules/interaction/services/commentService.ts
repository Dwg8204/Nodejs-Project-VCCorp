import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from 'modules/interaction/models/comment';
import { Post } from 'modules/post/models/post';
import { PostStatus } from 'common/enums/database.enums';
import { CreateCommentDto, QueryCommentDto } from '../validations/interactionValidation';
import { InteractionRealtimeService } from './interaction-realtime.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly realtime: InteractionRealtimeService,
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
          userName: user.userName,
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

    let parentId: string | null = null;
    let content = dto.content.trim();
    if (dto.parentId) {
      const repliedComment = await this.commentRepository.findOne({
        where: { id: dto.parentId, postId, deletedAt: null },
        relations: ['user'],
      });

      if (!repliedComment) {
        throw new NotFoundException({
          success: false,
          error: { code: 'PARENT_COMMENT_NOT_FOUND', message: 'Parent comment not found' }
        });
      }
      // The database stores only two levels: a root comment and its direct replies.
      // Replying to another reply still points to the original root comment.
      parentId = repliedComment.parentId ?? repliedComment.id;
      const repliedUserName = repliedComment.user?.userName?.trim();
      if (repliedUserName) {
        const mentionPrefix = `@${repliedUserName}`;
        if (repliedComment.userId === userId) {
          // A user replying to their own comment must not mention themselves.
          if (content.startsWith(mentionPrefix)) {
            content = content.slice(mentionPrefix.length).trimStart();
          }
        } else if (!content.startsWith(mentionPrefix)) {
          content = `${mentionPrefix} ${content}`;
        }
      }
    }

    const comment = this.commentRepository.create({
      userId,
      postId,
      parentId,
      content,
    });

    await this.commentRepository.save(comment);
    this.realtime.publish('COMMENT_CREATED', postId);

    return {
      success: true,
      message: 'COMMENT_CREATED',
      data: { item: comment },
    };
  }

  async remove(userId: number, postId: string, commentId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, postId, deletedAt: null },
    });
    if (!comment) {
      throw new NotFoundException({
        success: false,
        error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' },
      });
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'COMMENT_DELETE_FORBIDDEN',
          message: 'You can only delete your own comments',
        },
      });
    }

    const deleteResult = comment.parentId === null
      ? await this.commentRepository
          .createQueryBuilder()
          .softDelete()
          .where('post_id = :postId', { postId })
          .andWhere('(id = :commentId OR parent_id = :commentId)', { commentId })
          .execute()
      : await this.commentRepository.softDelete(comment.id);
    const deletedCount = deleteResult.affected ?? 1;
    this.realtime.publish('COMMENT_DELETED', postId);
    return {
      success: true,
      message: 'COMMENT_DELETED',
      data: { deletedCount },
    };
  }
}
