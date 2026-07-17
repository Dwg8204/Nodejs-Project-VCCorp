/**
 * =============================================================
 * Category Service - Xử lý logic nghiệp vụ cho Category
 * =============================================================
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from 'modules/category/models/category';
import { CategoryTranslation } from 'modules/category/models/categoryTranslation';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto,
} from 'modules/category/validations/categoryValidation';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(CategoryTranslation)
    private readonly translationRepository: Repository<CategoryTranslation>,
  ) {}

  /**
   * Tạo danh mục mới kèm bản dịch
   */
  async create(createCategoryDto: CreateCategoryDto) {
    // Tạo category trước
    const category = this.categoryRepository.create();
    await this.categoryRepository.save(category);

    // Tạo translations
    const translations = createCategoryDto.translations.map((t) =>
      this.translationRepository.create({
        categoryId: category.id,
        languageId: t.languageId,
        name: t.name,
        des: t.des,
      }),
    );
    await this.translationRepository.save(translations);

    // Load lại để lấy đầy đủ relations
    const result = await this.categoryRepository.findOne({
      where: { id: category.id },
    });

    return {
      success: true,
      message: 'Tạo danh mục thành công',
      data: { category: result },
    };
  }

  /**
   * Lấy danh sách danh mục (chỉ lấy chưa xóa mềm)
   */
  async findAll(queryDto: QueryCategoryDto) {
    const { page = 1, limit = 10, search = '' } = queryDto;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const queryBuilder = this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translation')
      .leftJoinAndSelect('translation.language', 'language')
      .where('category.deleted_at IS NULL');

    if (search) {
      queryBuilder.andWhere('translation.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    queryBuilder
      .orderBy('category.created_at', 'DESC')
      .skip(skip)
      .take(take);

    const [categories, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: {
        categories,
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
   * Lấy danh mục theo ID
   */
  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    return {
      success: true,
      data: { category },
    };
  }

  /**
   * Cập nhật danh mục (thay thế toàn bộ translations)
   */
  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    if (updateCategoryDto.translations && updateCategoryDto.translations.length > 0) {
      // Xóa translations cũ
      await this.translationRepository.delete({ categoryId: id });

      // Tạo translations mới
      const translations = updateCategoryDto.translations.map((t) =>
        this.translationRepository.create({
          categoryId: id,
          languageId: t.languageId,
          name: t.name,
          des: t.des,
        }),
      );
      await this.translationRepository.save(translations);
    }

    // Load lại
    const result = await this.categoryRepository.findOne({
      where: { id },
    });

    return {
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: { category: result },
    };
  }

  /**
   * Xóa mềm danh mục
   */
  async softDelete(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    category.deletedAt = new Date();
    await this.categoryRepository.save(category);

    return {
      success: true,
      message: 'Xóa danh mục thành công',
    };
  }

  /**
   * Khôi phục danh mục đã xóa mềm
   */
  async restore(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    if (!category.deletedAt) {
      throw new ConflictException('Danh mục này chưa bị xóa');
    }

    category.deletedAt = null;
    await this.categoryRepository.save(category);

    // Load lại đầy đủ
    const result = await this.categoryRepository.findOne({
      where: { id },
    });

    return {
      success: true,
      message: 'Khôi phục danh mục thành công',
      data: { category: result },
    };
  }
}
