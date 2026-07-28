import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { sanitizeAuditData } from 'common/utils/sanitize-audit-data.util';
import { AuditLog } from 'modules/audit/models/auditLog';
import { Brackets, Repository } from 'typeorm';
import {
  AuditLogSort,
  QueryAdminAuditLogsDto,
} from '../validations/admin-audit-logs.validation';

const MAX_DATE_RANGE_MS = 365 * 24 * 60 * 60 * 1_000;

@Injectable()
export class AdminAuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async findAll(dto: QueryAdminAuditLogsDto) {
    const { from, toExclusive } = this.parseDateRange(
      dto.fromDate,
      dto.toDate,
    );
    const query = this.auditRepository
      .createQueryBuilder('log')
      .select([
        'log.id',
        'log.actorId',
        'log.actorName',
        'log.actorRole',
        'log.action',
        'log.entityType',
        'log.entityId',
        'log.entityLabel',
        'log.ipAddress',
        'log.createdAt',
      ]);

    if (dto.search?.trim()) {
      query.andWhere(
        new Brackets((where) => {
          where
            .where('log.actor_name LIKE :search')
            .orWhere('log.entity_label LIKE :search')
            .orWhere('log.action LIKE :search')
            .orWhere('log.entity_type LIKE :search');
        }),
        { search: `%${dto.search.trim()}%` },
      );
    }
    if (dto.actorId) {
      query.andWhere('log.actor_id = :actorId', { actorId: dto.actorId });
    }
    if (dto.action) {
      query.andWhere('log.action = :action', { action: dto.action.trim() });
    }
    if (dto.entityType) {
      query.andWhere('log.entity_type = :entityType', {
        entityType: dto.entityType.trim(),
      });
    }
    if (dto.entityId) {
      query.andWhere('log.entity_id = :entityId', {
        entityId: dto.entityId,
      });
    }
    if (from) {
      query.andWhere('log.created_at >= :from', { from });
    }
    if (toExclusive) {
      query.andWhere('log.created_at < :toExclusive', { toExclusive });
    }

    const direction = dto.sort === AuditLogSort.Oldest ? 'ASC' : 'DESC';
    query
      .orderBy('log.createdAt', direction)
      .addOrderBy('log.id', direction)
      .skip((dto.page - 1) * dto.limit)
      .take(dto.limit);

    const [logs, total] = await query.getManyAndCount();
    return {
      success: true,
      data: {
        items: logs.map((log) => this.toListItem(log)),
        pagination: {
          page: dto.page,
          limit: dto.limit,
          total,
          totalPages: Math.ceil(total / dto.limit),
        },
      },
    };
  }

  async filterOptions() {
    const [actions, entityTypes, actors] = await Promise.all([
      this.auditRepository
        .createQueryBuilder('log')
        .select('log.action', 'value')
        .distinct(true)
        .orderBy('log.action', 'ASC')
        .getRawMany<{ value: string }>(),
      this.auditRepository
        .createQueryBuilder('log')
        .select('log.entity_type', 'value')
        .distinct(true)
        .orderBy('log.entity_type', 'ASC')
        .getRawMany<{ value: string }>(),
      this.auditRepository
        .createQueryBuilder('log')
        .select('log.actor_id', 'id')
        .addSelect('MAX(log.actor_name)', 'name')
        .addSelect('MAX(log.actor_role)', 'role')
        .where('log.actor_id IS NOT NULL')
        .groupBy('log.actor_id')
        .orderBy('name', 'ASC')
        .limit(1_000)
        .getRawMany<{ id: string; name: string | null; role: string | null }>(),
    ]);

    return {
      success: true,
      data: {
        actions: actions.map(({ value }) => value),
        entityTypes: entityTypes.map(({ value }) => value),
        actors: actors.map((actor) => ({
          id: Number(actor.id),
          name: actor.name,
          role: actor.role,
        })),
      },
    };
  }

  async findOne(id: string) {
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('ADMIN_AUDIT_LOG_ID_INVALID');
    }
    const log = await this.auditRepository.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException('ADMIN_AUDIT_LOG_NOT_FOUND');
    }

    return {
      success: true,
      data: {
        log: {
          ...this.toListItem(log),
          beforeData: sanitizeAuditData(log.beforeData),
          afterData: sanitizeAuditData(log.afterData),
          metadata: sanitizeAuditData(log.metadata),
          userAgent: log.userAgent,
        },
      },
    };
  }

  private parseDateRange(fromDate?: string, toDate?: string) {
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    const from = fromDate
      ? new Date(
          dateOnlyPattern.test(fromDate)
            ? `${fromDate}T00:00:00.000+07:00`
            : fromDate,
        )
      : null;
    let toExclusive: Date | null = null;
    if (toDate) {
      const to = new Date(
        dateOnlyPattern.test(toDate)
          ? `${toDate}T00:00:00.000+07:00`
          : toDate,
      );
      if (dateOnlyPattern.test(toDate)) {
        to.setDate(to.getDate() + 1);
      } else {
        to.setMilliseconds(to.getMilliseconds() + 1);
      }
      toExclusive = to;
    }

    if (from && toExclusive && from.getTime() >= toExclusive.getTime()) {
      throw new BadRequestException('ADMIN_AUDIT_DATE_RANGE_INVALID');
    }
    if (
      from &&
      toExclusive &&
      toExclusive.getTime() - from.getTime() > MAX_DATE_RANGE_MS
    ) {
      throw new BadRequestException('ADMIN_AUDIT_DATE_RANGE_TOO_LARGE');
    }
    return { from, toExclusive };
  }

  private toListItem(log: AuditLog) {
    return {
      id: log.id,
      actorId: log.actorId,
      actorName: log.actorName,
      actorRole: log.actorRole,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      entityLabel: log.entityLabel,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    };
  }
}
