import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Language } from 'modules/language/models/language';
import { Post } from './post';

@Entity({ name: 'post_translations' })
@Unique('uq_post_translation_language', ['postId', 'languageId'])
@Index('idx_post_translation_language', ['languageId', 'postId'])
export class PostTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'post_id', type: 'bigint', unsigned: true })
  postId: string;

  @Column({ name: 'language_id', type: 'int', unsigned: true })
  languageId: number;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ name: 'is_auto_translated', type: 'boolean', default: false })
  isAutoTranslated: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @ManyToOne(() => Post, (post) => post.translations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Language, (language) => language.postTranslations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'language_id' })
  language: Language;
}
