/**
 * =============================================================
 * CategoryTranslation Entity (TypeORM - MySQL)
 * =============================================================
 *
 * Entity tương ứng với bảng 'category_translation' trong MySQL.
 * Lưu bản dịch tên danh mục theo từng ngôn ngữ (i18n).
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category';
import { Language } from 'modules/language/models/language';

@Entity('category_translation')
export class CategoryTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'language_id' })
  languageId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  des: string;

  @ManyToOne(() => Category, (category) => category.translations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Language, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language_id' })
  language: Language;
}
