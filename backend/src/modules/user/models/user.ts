import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpPurpose } from 'common/enums/database.enums';
import { AuditLog } from 'modules/audit/models/auditLog';
import { Comment } from 'modules/interaction/models/comment';
import { PostLike } from 'modules/interaction/models/postLike';
import { Post } from 'modules/post/models/post';
import { Role } from './role';

@Entity({ name: 'users' })
@Index('idx_users_role_active', ['roleId', 'isActive'])
@Index('idx_users_created_at', ['createdAt'])
export class User {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'user_name', type: 'varchar', length: 191, unique: true })
  userName: string;

  @Column({ type: 'varchar', length: 191, unique: true })
  email: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  avatar: string | null;

  @Column({ name: 'cover_image', type: 'varchar', length: 2048, nullable: true })
  coverImage: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'role_id', type: 'int', unsigned: true })
  roleId: number;

  @Column({
    name: 'otp_code_hash',
    type: 'char',
    length: 64,
    nullable: true,
    select: false,
  })
  otpCodeHash: string | null;

  @Column({
    name: 'otp_purpose',
    type: 'varchar',
    length: 30,
    nullable: true,
    select: false,
  })
  otpPurpose: OtpPurpose | null;

  @Column({
    name: 'otp_expires_at',
    type: 'timestamp',
    nullable: true,
    select: false,
  })
  otpExpiresAt: Date | null;

  @Column({
    name: 'otp_attempt_count',
    type: 'smallint',
    unsigned: true,
    default: 0,
    select: false,
  })
  otpAttemptCount: number;

  @Column({
    name: 'otp_last_sent_at',
    type: 'timestamp',
    nullable: true,
    select: false,
  })
  otpLastSentAt: Date | null;

  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt: Date | null;

  @Column({
    name: 'refresh_token_hash',
    type: 'char',
    length: 64,
    nullable: true,
    select: false,
  })
  refreshTokenHash: string | null;

  @Column({
    name: 'refresh_token_expires_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
    select: false,
  })
  refreshTokenExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Role, (role) => role.users, {
    eager: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Post, (post) => post.reviewer)
  reviewedPosts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => PostLike, (postLike) => postLike.user)
  postLikes: PostLike[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.actor)
  auditLogs: AuditLog[];

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (!this.passwordHash || this.passwordHash.startsWith('$2')) {
      return;
    }
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return Boolean(
      this.passwordHash &&
        (await bcrypt.compare(candidatePassword, this.passwordHash)),
    );
  }
}
