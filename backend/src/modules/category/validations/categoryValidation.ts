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
}

// =============================================================
// DTO cho tạo danh mục mới
// =============================================================
export class CreateCategoryDto {
  @IsArray({ message: 'translations phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  translations: TranslationItemDto[];
}

// =============================================================
// DTO cho cập nhật danh mục
// =============================================================
export class UpdateCategoryDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  translations?: TranslationItemDto[];
}

// =============================================================
// DTO cho query params (phân trang + tìm kiếm)
// =============================================================
export class QueryCategoryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string = '';
}
