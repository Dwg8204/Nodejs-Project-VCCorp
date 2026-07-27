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
import { Language } from 'modules/language/models/language';
import { Post } from 'modules/post/models/post';
import { CategoryTranslation } from './categoryTranslation';

@Entity({ name: 'categories' })
@Index('idx_categories_active_created', ['deletedAt', 'createdAt'])
export class Category {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({
    name: 'source_language_id',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  sourceLanguageId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Language, (language) => language.sourceCategories, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'source_language_id' })
  sourceLanguage: Language | null;

  @OneToMany(
    () => CategoryTranslation,
    (translation) => translation.category,
  )
  translations: CategoryTranslation[];

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];
}
