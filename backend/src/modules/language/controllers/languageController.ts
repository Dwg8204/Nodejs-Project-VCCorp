/**
 * =============================================================
 * Language Controller - Quản lý ngôn ngữ hệ thống (Admin)
 * =============================================================
 *
 * Routes:
 *   POST   /api/languages            → create()
 *   GET    /api/languages            → findAll()
 *   GET    /api/languages/:id        → findOne()
 *   PUT    /api/languages/:id        → update()
 *   DELETE /api/languages/:id        → softDelete()
 *   PATCH  /api/languages/:id/restore → restore()
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
import { LanguageService } from 'modules/language/services/languageService';
import {
  CreateLanguageDto,
  UpdateLanguageDto,
  QueryLanguageDto,
} from 'modules/language/validations/languageValidation';
import { AuthGuard, RolesGuard, Roles } from 'modules/user/middlewares/authMiddleware';

@Controller('languages')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  /**
   * Tạo ngôn ngữ mới
   * POST /api/languages
   */
  @Post()
  create(@Body() createLanguageDto: CreateLanguageDto) {
    return this.languageService.create(createLanguageDto);
  }

  /**
   * Lấy danh sách ngôn ngữ
   * GET /api/languages
   */
  @Get()
  findAll(@Query() queryDto: QueryLanguageDto) {
    return this.languageService.findAll(queryDto);
  }

  /**
   * Lấy ngôn ngữ theo ID
   * GET /api/languages/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.languageService.findOne(id);
  }

  /**
   * Cập nhật ngôn ngữ
   * PUT /api/languages/:id
   */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLanguageDto: UpdateLanguageDto,
  ) {
    return this.languageService.update(id, updateLanguageDto);
  }

  /**
   * Xóa mềm ngôn ngữ
   * DELETE /api/languages/:id
   */
  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.languageService.softDelete(id);
  }

  /**
   * Khôi phục ngôn ngữ đã xóa
   * PATCH /api/languages/:id/restore
   */
  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.languageService.restore(id);
  }
}
