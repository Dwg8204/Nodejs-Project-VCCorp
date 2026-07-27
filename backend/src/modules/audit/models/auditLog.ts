import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'modules/user/models/user';

export type AuditJson = Record<string, unknown>;

@Entity({ name: 'audit_logs' })
@Index('idx_audit_created_id', ['createdAt', 'id'])
@Index('idx_audit_actor_created', ['actorId', 'createdAt'])
@Index('idx_audit_action_created', ['action', 'createdAt'])
@Index('idx_audit_entity_created', ['entityType', 'entityId', 'createdAt'])
@Index('idx_audit_role_created', ['actorRole', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'actor_id', type: 'int', unsigned: true, nullable: true })
  actorId: number | null;

  @Column({ name: 'actor_name', type: 'varchar', length: 255, nullable: true })
  actorName: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 50, nullable: true })
  actorRole: string | null;

  @Column({ type: 'varchar', length: 80 })
  action: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'bigint', unsigned: true, nullable: true })
  entityId: string | null;

  @Column({
    name: 'entity_label',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  entityLabel: string | null;

  @Column({ name: 'before_data', type: 'json', nullable: true })
  beforeData: AuditJson | null;

  @Column({ name: 'after_data', type: 'json', nullable: true })
  afterData: AuditJson | null;

  @Column({ type: 'json', nullable: true })
  metadata: AuditJson | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;
}
