import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from 'common/dto/pagination-query.dto';
import { LanguageTranslationStatus } from 'common/enums/database.enums';

export enum LanguageRecordFilter {
  Active = 'active',
  Deleted = 'deleted',
  All = 'all',
}

export enum LanguageSort {
  Newest = 'newest',
  Oldest = 'oldest',
  Ascending = 'a-z',
  Descending = 'z-a',
}

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

export class QueryAdminLanguagesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search = '';

  @IsOptional()
  @IsEnum(LanguageTranslationStatus)
  translationStatus?: LanguageTranslationStatus;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(LanguageRecordFilter)
  records: LanguageRecordFilter = LanguageRecordFilter.Active;

  @IsOptional()
  @IsEnum(LanguageSort)
  sort: LanguageSort = LanguageSort.Newest;
}

export class CreateAdminLanguageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(35)
  @Matches(/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/)
  code: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  flag?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fallbackLanguageId?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive = true;

  @IsOptional()
  @IsEnum(LanguageTranslationStatus)
  translationStatus: LanguageTranslationStatus =
    LanguageTranslationStatus.Draft;
}

export class UpdateAdminLanguageDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(35)
  @Matches(/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  flag?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fallbackLanguageId?: number | null;
}

export class ChangeLanguageStatusDto {
  @IsBoolean()
  isActive: boolean;

  @IsEnum(LanguageTranslationStatus)
  translationStatus: LanguageTranslationStatus;
}
