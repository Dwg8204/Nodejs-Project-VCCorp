/**
 * =============================================================
 * Category Controller - Quản lý danh mục (Admin)
 * =============================================================
 *
 * Routes:
 *   POST   /api/categories            → create()
 *   GET    /api/categories            → findAll()
 *   GET    /api/categories/:id        → findOne()
 *   PUT    /api/categories/:id        → update()
 *   DELETE /api/categories/:id        → softDelete()
 *   PATCH  /api/categories/:id/restore → restore()
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoryService } from 'modules/category/services/categoryService';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto,
} from 'modules/category/validations/categoryValidation';
import { RoleName } from 'common/enums/database.enums';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SuperAdmin)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Tạo danh mục mới
   * POST /api/categories
   */
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  /**
   * Lấy danh sách danh mục
   * GET /api/categories
   */
  @Get()
  findAll(@Query() queryDto: QueryCategoryDto) {
    return this.categoryService.findAll(queryDto);
  }

  /**
   * Lấy danh mục theo ID
   * GET /api/categories/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  /**
   * Cập nhật danh mục
   * PUT /api/categories/:id
   */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  /**
   * Xóa mềm danh mục
   * DELETE /api/categories/:id
   */
  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.softDelete(id);
  }

  /**
   * Khôi phục danh mục đã xóa
   * PATCH /api/categories/:id/restore
   */
  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.restore(id);
  }
}
