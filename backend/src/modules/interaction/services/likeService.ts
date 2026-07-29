import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLike } from 'modules/interaction/models/postLike';
import { Post } from 'modules/post/models/post';
import { PostStatus } from 'common/enums/database.enums';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(PostLike)
    private readonly likeRepository: Repository<PostLike>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

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
      await this.likeRepository.remove(existingLike);
      liked = false;
    } else {
      const newLike = this.likeRepository.create({ userId, postId });
      await this.likeRepository.save(newLike);
      liked = true;
    }

    const totalLikes = await this.likeRepository.count({
      where: { postId },
    });

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
