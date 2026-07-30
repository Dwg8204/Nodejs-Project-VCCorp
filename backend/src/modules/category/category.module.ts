import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './models/category';
import { CategoryTranslation } from './models/categoryTranslation';
import { CategoryController } from './controllers/categoryController';
import { CategoryPublicController } from './controllers/categoryPublicController';
import { CategoryService } from './services/categoryService';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';
import { AuditModule } from 'modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, CategoryTranslation]),
    AuthModule,
    UserModule,
    AuditModule,
  ],
  controllers: [CategoryController, CategoryPublicController],
  providers: [CategoryService],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule {}
