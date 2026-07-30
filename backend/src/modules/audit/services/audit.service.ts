import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditJson, AuditLog } from '../models/auditLog';

export interface RecordAuditInput {
  actorId?: number | null;
  actorName?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  entityLabel?: string | null;
  beforeData?: AuditJson | null;
  afterData?: AuditJson | null;
  metadata?: AuditJson | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async record(
    input: RecordAuditInput,
    manager?: EntityManager,
  ): Promise<AuditLog> {
    const repository = manager
      ? manager.getRepository(AuditLog)
      : this.auditRepository;
    const log = repository.create({
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId:
        input.entityId === undefined || input.entityId === null
          ? null
          : String(input.entityId),
      entityLabel: input.entityLabel ?? null,
      beforeData: input.beforeData ?? null,
      afterData: input.afterData ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
    });
    return repository.save(log);
  }
}
