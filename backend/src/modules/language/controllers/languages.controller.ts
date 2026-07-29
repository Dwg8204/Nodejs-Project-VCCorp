import { Controller, Get } from '@nestjs/common';
import { LanguagesService } from '../services/languages.service';

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  findAvailable() {
    return this.languagesService.findAvailable();
  }
}
