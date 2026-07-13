/**
 * =============================================================
 * User Entity (TypeORM - MySQL)
 * =============================================================
 *
 * Đặt tên file: số ít (user.ts, category.ts, ...)
 * Entity tương ứng với bảng 'users' trong MySQL.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './role';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_name', type: 'varchar', length: 255, unique: true })
  userName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false, nullable: true })
  passwordHash: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'otp_code', type: 'varchar', length: 10, nullable: true })
  otpCode: string;

  @Column({ name: 'otp_created_at', type: 'timestamp', nullable: true })
  otpCreatedAt: Date;

  @Column({ name: 'otp_ttl_seconds', type: 'int', default: 180 })
  otpTtlSeconds: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // =============================================================
  // Hook: Hash password trước khi insert vào database
  // =============================================================
  @BeforeInsert()
  async hashPassword() {
    if (this.passwordHash) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
      const salt = await bcrypt.genSalt(saltRounds);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
  }

  // =============================================================
  // Instance Method: So sánh password
  // =============================================================
  async comparePassword(candidatePassword: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(candidatePassword, this.passwordHash);
  }
}
