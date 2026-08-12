import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'modules/user/models/user';

@Entity({ name: 'user_sessions' })
@Index('idx_user_sessions_user_active', ['userId', 'revokedAt', 'expiresAt'])
@Index('idx_user_sessions_expires_at', ['expiresAt'])
export class UserSession {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ name: 'user_id', type: 'int', unsigned: true })
  userId: number;

  @Column({ name: 'refresh_token_hash', type: 'char', length: 64, unique: true, select: false })
  refreshTokenHash: string;

  @Column({ name: 'expires_at', type: 'datetime', precision: 6 })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'datetime', precision: 6, nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'last_used_at', type: 'datetime', precision: 6, nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
