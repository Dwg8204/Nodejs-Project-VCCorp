import { Controller, Get, Query } from '@nestjs/common';
import { CategoryService } from 'modules/category/services/categoryService';
import { QueryCategoryDto } from 'modules/category/validations/categoryValidation';

@Controller('public/categories') // Tạm thời dùng public/categories để tránh conflict
export class CategoryPublicController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Lấy danh sách danh mục cho Public API
   * GET /api/public/categories
   */
  @Get()
  findAll(@Query() queryDto: QueryCategoryDto) {
    // Tái sử dụng service của Người 1
    return this.categoryService.findAll(queryDto);
  }
}
