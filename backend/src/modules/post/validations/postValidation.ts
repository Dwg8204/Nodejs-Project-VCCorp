import {
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from 'common/enums/database.enums';

export class TranslationItemDto {
  @IsInt()
  @Min(1)
  languageId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsBoolean()
  isAutoTranslated?: boolean;
}

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  thumbnail: string;

  @IsInt()
  @Min(1)
  categoryId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sourceLanguageId?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  translations: TranslationItemDto[];
}

export class UpdatePostDto {
  @IsInt()
  @Min(1)
  expectedVersion: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  thumbnail?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sourceLanguageId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  translations?: TranslationItemDto[];
}

export class QueryPostDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  language?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'popular'])
  sort?: 'newest' | 'oldest' | 'popular' = 'newest';

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  authorId?: number;
}

export class QueryOwnerPostDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'title-asc', 'title-desc'])
  sort?: 'newest' | 'oldest' | 'title-asc' | 'title-desc' = 'newest';
}

export class QueryAdminPostDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  authorId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'title-asc', 'title-desc'])
  sort?: 'newest' | 'oldest' | 'title-asc' | 'title-desc' = 'newest';
}

export class ReviewPostDto {
  @IsInt()
  @Min(1)
  expectedVersion: number;
}

export class RejectPostDto extends ReviewPostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  reason: string;
}
