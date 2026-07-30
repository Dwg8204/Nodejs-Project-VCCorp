/**
 * =============================================================
 * Category Validation - DTOs
 * =============================================================
 */

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsInt,
  IsIn,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// =============================================================
// DTO cho một bản dịch danh mục
// =============================================================
export class TranslationItemDto {
  @IsNotEmpty({ message: 'language_id là bắt buộc' })
  @IsNumber()
  languageId: number;

  @IsNotEmpty({ message: 'Tên danh mục là bắt buộc' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  des?: string;

  @IsOptional()
  @IsBoolean()
  isAutoTranslated?: boolean;
}

// =============================================================
// DTO cho tạo danh mục mới
// =============================================================
export class CreateCategoryDto {
  @IsInt()
  @Min(1)
  sourceLanguageId: number;

  @IsArray({ message: 'translations phải là một mảng' })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  translations: TranslationItemDto[];
}

// =============================================================
// DTO cho cập nhật danh mục
// =============================================================
export class UpdateCategoryDto {
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

// =============================================================
// DTO cho query params (phân trang + tìm kiếm)
// =============================================================
export class QueryCategoryDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'name-asc', 'name-desc'])
  sort?: 'newest' | 'oldest' | 'name-asc' | 'name-desc' = 'newest';

  @IsOptional()
  @IsString()
  search?: string = '';
}
