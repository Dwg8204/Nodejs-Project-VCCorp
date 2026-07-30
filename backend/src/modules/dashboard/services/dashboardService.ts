import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PostStatus } from 'common/enums/database.enums';
import { AuditLog } from 'modules/audit/models/auditLog';
import { Category } from 'modules/category/models/category';
import { Comment } from 'modules/interaction/models/comment';
import { PostLike } from 'modules/interaction/models/postLike';
import { Language } from 'modules/language/models/language';
import { Post } from 'modules/post/models/post';
import { PostTranslation } from 'modules/post/models/postTranslation';
import { User } from 'modules/user/models/user';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(PostLike) private readonly likes: Repository<PostLike>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Language) private readonly languages: Repository<Language>,
    @InjectRepository(PostTranslation) private readonly translations: Repository<PostTranslation>,
    @InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>,
  ) {}

  async getStats(requestedPeriod = 30) {
    const period = [7, 30, 90].includes(requestedPeriod) ? requestedPeriod : 30;
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - period + 1);
    const statusRows = await this.posts.createQueryBuilder('post')
      .select('post.status', 'status').addSelect('COUNT(post.id)', 'total')
      .where('post.deletedAt IS NULL').groupBy('post.status').getRawMany<{ status: PostStatus; total: string }>();
    const status = Object.fromEntries(Object.values(PostStatus).map((value) => [value, 0])) as Record<PostStatus, number>;
    statusRows.forEach((row) => status[row.status] = Number(row.total));

    const [totalComments, totalLikes, totalUsers, totalCategories, totalLanguages, trendLikes, trendComments, topPosts, byCategory, translatedRows, recentActivity] = await Promise.all([
      this.comments.count({ where: { deletedAt: IsNull() } }),
      this.likes.count({ where: { isLiked: true } }),
      this.users.count(),
      this.categories.count({ where: { deletedAt: IsNull() } }),
      this.languages.count({ where: { isActive: true, deletedAt: IsNull() } }),
      this.likes.createQueryBuilder('like').select('DATE(like.updatedAt)', 'date').addSelect('COUNT(like.id)', 'total')
        .where('like.isLiked = 1').andWhere('like.updatedAt >= :since', { since }).groupBy('DATE(like.updatedAt)').getRawMany(),
      this.comments.createQueryBuilder('comment').select('DATE(comment.createdAt)', 'date').addSelect('COUNT(comment.id)', 'total')
        .where('comment.deletedAt IS NULL').andWhere('comment.createdAt >= :since', { since }).groupBy('DATE(comment.createdAt)').getRawMany(),
      this.posts.createQueryBuilder('post').leftJoinAndSelect('post.translations', 'translation')
        .leftJoin('post.likes', 'like', 'like.isLiked = 1').leftJoin('post.comments', 'comment', 'comment.deletedAt IS NULL')
        .select(['post.id', 'post.thumbnail', 'translation.id', 'translation.languageId', 'translation.title'])
        .addSelect('COUNT(DISTINCT like.id)', 'likesCount').addSelect('COUNT(DISTINCT comment.id)', 'commentsCount')
        .where('post.status = :published', { published: PostStatus.Published }).andWhere('post.deletedAt IS NULL')
        .groupBy('post.id').addGroupBy('translation.id').orderBy('likesCount + commentsCount', 'DESC').take(5).getRawAndEntities(),
      this.posts.createQueryBuilder('post').leftJoin('post.category', 'category')
        .leftJoin('category.translations', 'translation').select('category.id', 'categoryId')
        .addSelect('translation.languageId', 'languageId').addSelect('translation.name', 'name')
        .addSelect('COUNT(DISTINCT post.id)', 'postsCount').where('post.deletedAt IS NULL')
        .groupBy('category.id').addGroupBy('translation.id').getRawMany(),
      this.translations.createQueryBuilder('translation').select('translation.languageId', 'languageId')
        .addSelect('COUNT(translation.id)', 'total').addSelect('SUM(translation.isAutoTranslated)', 'autoTranslated')
        .groupBy('translation.languageId').getRawMany(),
      this.auditLogs.find({ order: { createdAt: 'DESC', id: 'DESC' }, take: 6 }),
    ]);

    const likeMap = new Map(trendLikes.map((row) => [String(row.date), Number(row.total)]));
    const commentMap = new Map(trendComments.map((row) => [String(row.date), Number(row.total)]));
    const engagementTrend = Array.from({ length: period }, (_, offset) => {
      const date = new Date(since); date.setDate(since.getDate() + offset);
      const key = date.toISOString().slice(0, 10);
      return { date: key, likes: likeMap.get(key) ?? 0, comments: commentMap.get(key) ?? 0 };
    });
    const topItems = topPosts.entities.map((post) => {
      const raw = topPosts.raw.find((row) => String(row.post_id) === String(post.id)) ?? {};
      return { ...post, likesCount: Number(raw.likesCount ?? 0), commentsCount: Number(raw.commentsCount ?? 0) };
    });
    const totalPosts = Object.values(status).reduce((sum, value) => sum + value, 0);
    return { success: true, data: {
      period,
      stats: { posts: totalPosts, users: totalUsers, categories: totalCategories, languages: totalLanguages, likes: totalLikes, comments: totalComments, engagementPerPost: totalPosts ? Number(((totalLikes + totalComments) / totalPosts).toFixed(2)) : 0 },
      postStatus: status,
      engagementTrend,
      topPosts: topItems,
      contentByCategory: byCategory.map((row) => ({ ...row, categoryId: Number(row.categoryId), languageId: Number(row.languageId), postsCount: Number(row.postsCount) })),
      translationCoverage: translatedRows.map((row) => ({ languageId: Number(row.languageId), total: Number(row.total), autoTranslated: Number(row.autoTranslated) })),
      recentActivity,
    } };
  }
}
