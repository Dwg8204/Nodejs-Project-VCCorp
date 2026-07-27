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
import { LanguageTranslationStatus } from 'common/enums/database.enums';
import { Category } from 'modules/category/models/category';
import { CategoryTranslation } from 'modules/category/models/categoryTranslation';
import { Post } from 'modules/post/models/post';
import { PostTranslation } from 'modules/post/models/postTranslation';

@Entity({ name: 'languages' })
@Index('idx_languages_public', [
  'isActive',
  'isSystemLanguage',
  'translationStatus',
  'deletedAt',
])
@Index('idx_languages_fallback', ['fallbackLanguageId'])
export class Language {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 35, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  flag: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_system_language', type: 'boolean', default: false })
  isSystemLanguage: boolean;

  @Column({
    name: 'fallback_language_id',
    type: 'int',
    unsigned: true,
    nullable: true,
  })
  fallbackLanguageId: number | null;

  @Column({
    name: 'translation_status',
    type: 'varchar',
    length: 20,
    default: LanguageTranslationStatus.Draft,
  })
  translationStatus: LanguageTranslationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Language, (language) => language.fallbackForLanguages, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'fallback_language_id' })
  fallbackLanguage: Language | null;

  @OneToMany(() => Language, (language) => language.fallbackLanguage)
  fallbackForLanguages: Language[];

  @OneToMany(() => Category, (category) => category.sourceLanguage)
  sourceCategories: Category[];

  @OneToMany(
    () => CategoryTranslation,
    (translation) => translation.language,
  )
  categoryTranslations: CategoryTranslation[];

  @OneToMany(() => Post, (post) => post.sourceLanguage)
  sourcePosts: Post[];

  @OneToMany(() => PostTranslation, (translation) => translation.language)
  postTranslations: PostTranslation[];
}
