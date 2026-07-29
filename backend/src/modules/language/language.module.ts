import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from './models/language';
import { LanguageController } from './controllers/languageController';
import { LanguagePublicController } from './controllers/languagePublicController';
import { LanguageService } from './services/languageService';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Language]),
    AuthModule,
    UserModule,
  ],
  controllers: [LanguageController, LanguagePublicController],
  providers: [LanguageService],
  exports: [LanguageService, TypeOrmModule],
})
export class LanguageModule {}
