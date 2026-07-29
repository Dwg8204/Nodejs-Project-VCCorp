import {
  IsArray,
  IsEnum,
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
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  translations: TranslationItemDto[];
}

export class UpdatePostDto {
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
  @IsString()
  sort?: 'newest' | 'oldest' | 'popular' = 'newest';
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
}

export class RejectPostDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
