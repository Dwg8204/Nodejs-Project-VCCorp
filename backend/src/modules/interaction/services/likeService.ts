import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLike } from 'modules/interaction/models/postLike';
import { Post } from 'modules/post/models/post';
import { PostStatus } from 'common/enums/database.enums';
import { InteractionRealtimeService } from './interaction-realtime.service';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(PostLike)
    private readonly likeRepository: Repository<PostLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly realtime: InteractionRealtimeService,
  ) {}

  async getMyLike(userId: number, postId: string) {
    const like = await this.likeRepository.findOne({
      where: { userId, postId },
    });
    return {
      success: true,
      data: { liked: like?.isLiked ?? false },
    };
  }

  async toggleLike(userId: number, postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: null, status: PostStatus.Published },
    });

    if (!post) {
      throw new NotFoundException({
        success: false,
        error: { code: 'POST_NOT_FOUND', message: 'Post not found or unpublished' }
      });
    }

    const existingLike = await this.likeRepository.findOne({
      where: { userId, postId },
    });

    let liked = false;

    if (existingLike) {
      existingLike.isLiked = !existingLike.isLiked;
      await this.likeRepository.save(existingLike);
      liked = existingLike.isLiked;
    } else {
      const newLike = this.likeRepository.create({
        userId,
        postId,
        isLiked: true,
      });
      await this.likeRepository.save(newLike);
      liked = true;
    }

    const totalLikes = await this.likeRepository.count({
      where: { postId, isLiked: true },
    });
    this.realtime.publish('LIKE_CHANGED', postId);

    return {
      success: true,
      message: liked ? 'POST_LIKED' : 'POST_UNLIKED',
      data: {
        liked,
        totalLikes,
      }
    };
  }
}
