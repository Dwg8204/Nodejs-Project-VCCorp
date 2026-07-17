/**
 * =============================================================
 * Language Validation - DTOs
 * =============================================================
 */

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';

// =============================================================
// DTO cho tạo ngôn ngữ mới
// =============================================================
export class CreateLanguageDto {
  @IsNotEmpty({ message: 'Mã ngôn ngữ là bắt buộc' })
  @IsString()
  @MaxLength(5, { message: 'Mã ngôn ngữ tối đa 5 ký tự' })
  code: string;

  @IsNotEmpty({ message: 'Tên ngôn ngữ là bắt buộc' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  flag?: string;
}

// =============================================================
// DTO cho cập nhật ngôn ngữ
// =============================================================
export class UpdateLanguageDto {
  @IsOptional()
  @IsString()
  @MaxLength(5, { message: 'Mã ngôn ngữ tối đa 5 ký tự' })
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  flag?: string;
}

// =============================================================
// DTO cho query params (phân trang + tìm kiếm)
// =============================================================
export class QueryLanguageDto {
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
