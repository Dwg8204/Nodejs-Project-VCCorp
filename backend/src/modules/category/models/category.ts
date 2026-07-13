/**
 * =============================================================
 * Category Entity (TypeORM - MySQL)
 * =============================================================
 *
 * Entity tương ứng với bảng 'categories' trong MySQL.
 * Hỗ trợ xóa mềm qua trường deleted_at.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { CategoryTranslation } from './categoryTranslation';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true, default: null })
  deletedAt: Date;

  @OneToMany(() => CategoryTranslation, (translation) => translation.category, { eager: true })
  translations: CategoryTranslation[];
}
