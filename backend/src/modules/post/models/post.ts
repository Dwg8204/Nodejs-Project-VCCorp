import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PostStatus } from 'common/enums/database.enums';
import { Category } from 'modules/category/models/category';
import { Comment } from 'modules/interaction/models/comment';
import { PostLike } from 'modules/interaction/models/postLike';
import { Language } from 'modules/language/models/language';
import { User } from 'modules/user/models/user';
import { PostTranslation } from './postTranslation';

@Entity({ name: 'posts' })
@Index('idx_posts_public_feed', ['status', 'deletedAt', 'publishedAt'])
@Index('idx_posts_author_status_created', ['authorId', 'status', 'createdAt'])
@Index('idx_posts_category_status_published', [
  'categoryId',
  'status',
  'publishedAt',
])
@Index('idx_posts_reviewer', ['reviewedBy', 'reviewedAt'])
export class Post {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'author_id', type: 'int', unsigned: true })
  authorId: number;

  @Column({ name: 'category_id', type: 'int', unsigned: true })
  categoryId: number;

  @Column({
    name: 'source_language_id',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  sourceLanguageId: number | null;

  @Column({ type: 'varchar', length: 2048 })
  thumbnail: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PostStatus.Draft,
  })
  status: PostStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'submitted_at', type: 'datetime', precision: 6, nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'reviewed_by', type: 'int', unsigned: true, nullable: true })
  reviewedBy: number | null;

  @Column({ name: 'reviewed_at', type: 'datetime', precision: 6, nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'published_at', type: 'datetime', precision: 6, nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => User, (user) => user.reviewedPosts, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User | null;

  @ManyToOne(() => Category, (category) => category.posts, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Language, (language) => language.sourcePosts, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'source_language_id' })
  sourceLanguage: Language | null;

  @OneToMany(() => PostTranslation, (translation) => translation.post)
  translations: PostTranslation[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => PostLike, (postLike) => postLike.post)
  likes: PostLike[];
}
