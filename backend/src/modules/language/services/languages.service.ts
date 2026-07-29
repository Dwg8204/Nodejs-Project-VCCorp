import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LanguageTranslationStatus } from 'common/enums/database.enums';
import { IsNull, Repository } from 'typeorm';
import { Language } from '../models/language';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async findAvailable() {
    const languages = await this.languageRepository.find({
      where: {
        isActive: true,
        translationStatus: LanguageTranslationStatus.Ready,
        deletedAt: IsNull(),
      },
      order: { isSystemLanguage: 'DESC', id: 'ASC' },
    });
    return {
      success: true,
      data: {
        items: languages.map((language) => ({
          id: language.id,
          code: language.code,
          name: language.name,
          flag: language.flag,
          fallbackLanguageId: language.fallbackLanguageId,
        })),
      },
    };
  }
}
