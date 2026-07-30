import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Language } from 'modules/language/models/language';
import { Category } from './category';

@Entity({ name: 'category_translation' })
@Unique('uq_category_translation_language', ['categoryId', 'languageId'])
@Unique('uq_category_translation_language_name', ['languageId', 'name'])
export class CategoryTranslation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'category_id', type: 'int', unsigned: true })
  categoryId: number;

  @Column({ name: 'language_id', type: 'int', unsigned: true })
  languageId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  des: string | null;

  @Column({ name: 'is_auto_translated', type: 'boolean', default: false })
  isAutoTranslated: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.translations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Language, (language) => language.categoryTranslations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'language_id' })
  language: Language;
}
