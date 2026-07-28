import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from 'common/dto/pagination-query.dto';

export enum AuditLogSort {
  Newest = 'newest',
  Oldest = 'oldest',
}

export class QueryAdminAuditLogsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search = '';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  actorId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  entityType?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  entityId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(AuditLogSort)
  sort: AuditLogSort = AuditLogSort.Newest;
}
