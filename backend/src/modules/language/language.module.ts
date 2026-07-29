import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from './models/language';
import { LanguagesController } from './controllers/languages.controller';
import { LanguagesService } from './services/languages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Language])],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  exports: [TypeOrmModule, LanguagesService],
})
export class LanguageModule {}
