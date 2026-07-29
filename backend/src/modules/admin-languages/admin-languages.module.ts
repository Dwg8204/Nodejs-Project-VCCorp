import { Module } from '@nestjs/common';
import { AuditModule } from 'modules/audit/audit.module';
import { AuthModule } from 'modules/auth/auth.module';
import { LanguageModule } from 'modules/language/language.module';
import { AdminLanguagesController } from './controllers/admin-languages.controller';
import { AdminLanguagesService } from './services/admin-languages.service';

@Module({
  imports: [LanguageModule, AuthModule, AuditModule],
  controllers: [AdminLanguagesController],
  providers: [AdminLanguagesService],
})
export class AdminLanguagesModule {}
