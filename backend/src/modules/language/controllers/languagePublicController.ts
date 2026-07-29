import { Controller, Get, Query } from '@nestjs/common';
import { LanguageService } from 'modules/language/services/languageService';
import { QueryLanguageDto } from 'modules/language/validations/languageValidation';

@Controller('public/languages') // Tạm thời dùng public/languages để tránh conflict với /languages của Admin (Người 1)
export class LanguagePublicController {
  constructor(private readonly languageService: LanguageService) {}

  /**
   * Lấy danh sách ngôn ngữ cho Public API
   * GET /api/public/languages
   */
  @Get()
  findAll(@Query() queryDto: QueryLanguageDto) {
    // Tái sử dụng service của Người 1, public API chỉ cần lấy danh sách
    return this.languageService.findAll(queryDto);
  }
}
