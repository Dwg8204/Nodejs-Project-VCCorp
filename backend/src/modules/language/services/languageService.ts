/**
 * =============================================================
 * Language Service - Xử lý logic nghiệp vụ cho Language
 * =============================================================
 */

import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Language } from 'modules/language/models/language';
import {
  CreateLanguageDto,
  UpdateLanguageDto,
  QueryLanguageDto,
} from 'modules/language/validations/languageValidation';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  /**
   * Tạo ngôn ngữ mới
   */
  async create(createLanguageDto: CreateLanguageDto) {
    // Kiểm tra code đã tồn tại chưa
    const existing = await this.languageRepository.findOne({
      where: { code: createLanguageDto.code },
    });
    if (existing) {
      throw new ConflictException(`Mã ngôn ngữ '${createLanguageDto.code}' đã tồn tại`);
    }

    const language = this.languageRepository.create(createLanguageDto);
    await this.languageRepository.save(language);

    return {
      success: true,
      message: 'Tạo ngôn ngữ thành công',
      data: { language },
    };
  }

  /**
   * Lấy danh sách ngôn ngữ (chỉ lấy chưa xóa mềm)
   */
  async findAll(queryDto: QueryLanguageDto) {
    const { page = 1, limit = 10, search = '' } = queryDto;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const queryBuilder = this.languageRepository.createQueryBuilder('language');

    // Chỉ lấy bản ghi chưa xóa mềm
    queryBuilder.where('language.deleted_at IS NULL');

    if (search) {
      queryBuilder.andWhere(
        '(language.code LIKE :search OR language.name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('language.created_at', 'DESC')
      .skip(skip)
      .take(take);

    const [languages, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: {
        languages,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    };
  }

  /**
   * Lấy ngôn ngữ theo ID
   */
  async findOne(id: number) {
    const language = await this.languageRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!language) {
      throw new NotFoundException('Không tìm thấy ngôn ngữ');
    }

    return {
      success: true,
      data: { language },
    };
  }

  /**
   * Cập nhật ngôn ngữ
   */
  async update(id: number, updateLanguageDto: UpdateLanguageDto) {
    const language = await this.languageRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!language) {
      throw new NotFoundException('Không tìm thấy ngôn ngữ');
    }

    // Kiểm tra code trùng nếu thay đổi
    if (updateLanguageDto.code && updateLanguageDto.code !== language.code) {
      const existing = await this.languageRepository.findOne({
        where: { code: updateLanguageDto.code },
      });
      if (existing) {
        throw new ConflictException(`Mã ngôn ngữ '${updateLanguageDto.code}' đã tồn tại`);
      }
    }

    Object.assign(language, updateLanguageDto);
    await this.languageRepository.save(language);

    return {
      success: true,
      message: 'Cập nhật ngôn ngữ thành công',
      data: { language },
    };
  }

  /**
   * Xóa mềm ngôn ngữ (gán deleted_at = NOW())
   */
  async softDelete(id: number) {
    const language = await this.languageRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!language) {
      throw new NotFoundException('Không tìm thấy ngôn ngữ');
    }

    language.deletedAt = new Date();
    await this.languageRepository.save(language);

    return {
      success: true,
      message: 'Xóa ngôn ngữ thành công',
    };
  }

  /**
   * Khôi phục ngôn ngữ đã xóa mềm
   */
  async restore(id: number) {
    const language = await this.languageRepository.findOne({
      where: { id },
    });
    if (!language) {
      throw new NotFoundException('Không tìm thấy ngôn ngữ');
    }
    if (!language.deletedAt) {
      throw new ConflictException('Ngôn ngữ này chưa bị xóa');
    }

    language.deletedAt = null;
    await this.languageRepository.save(language);

    return {
      success: true,
      message: 'Khôi phục ngôn ngữ thành công',
      data: { language },
    };
  }
}
