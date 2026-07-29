import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from 'modules/post/models/post';
import { Comment } from 'modules/interaction/models/comment';
import { PostLike } from 'modules/interaction/models/postLike';
import { User } from 'modules/user/models/user';
import { PostStatus } from 'common/enums/database.enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(PostLike)
    private readonly likeRepository: Repository<PostLike>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getStats() {
    const [
      totalDraftPosts,
      totalPendingPosts,
      totalPublishedPosts,
      totalRejectedPosts,
      totalComments,
      totalLikes,
      totalUsers,
    ] = await Promise.all([
      this.postRepository.count({ where: { status: PostStatus.Draft, deletedAt: null } }),
      this.postRepository.count({ where: { status: PostStatus.Pending, deletedAt: null } }),
      this.postRepository.count({ where: { status: PostStatus.Published, deletedAt: null } }),
      this.postRepository.count({ where: { status: PostStatus.Rejected, deletedAt: null } }),
      this.commentRepository.count({ where: { deletedAt: null } }),
      this.likeRepository.count(),
      this.userRepository.count(),
    ]);

    const topPosts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.translations', 'translation')
      .where('post.status = :status', { status: PostStatus.Published })
      .andWhere('post.deletedAt IS NULL')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(likes.id)', 'likesCount')
          .from('post_likes', 'likes')
          .where('likes.post_id = post.id');
      }, 'likesCount')
      .orderBy('likesCount', 'DESC')
      .take(5)
      .getMany();

    return {
      success: true,
      data: {
        posts: {
          draft: totalDraftPosts,
          pending: totalPendingPosts,
          published: totalPublishedPosts,
          rejected: totalRejectedPosts,
          total: totalDraftPosts + totalPendingPosts + totalPublishedPosts + totalRejectedPosts,
        },
        interactions: {
          comments: totalComments,
          likes: totalLikes,
        },
        users: {
          total: totalUsers,
        },
        topPosts,
      },
    };
  }
}
