import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from 'common/enums/database.enums';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { RequestMetadata } from 'modules/auth/decorators/request-context.decorator';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import {
  AuthenticatedUser,
  RequestContext,
} from 'modules/auth/interfaces/auth-user.interface';
import { AdminLanguagesService } from '../services/admin-languages.service';
import {
  ChangeLanguageStatusDto,
  QueryAdminLanguagesDto,
  UpdateAdminLanguageDto,
} from '../validations/admin-languages.validation';

@Controller('admin/languages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SuperAdmin)
export class AdminLanguagesController {
  constructor(
    private readonly adminLanguagesService: AdminLanguagesService,
  ) {}

  @Get()
  findAll(@Query() dto: QueryAdminLanguagesDto) {
    return this.adminLanguagesService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminLanguagesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminLanguageDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminLanguagesService.update(id, dto, actor, context);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeLanguageStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminLanguagesService.changeStatus(id, dto, actor, context);
  }

  @Delete(':id')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminLanguagesService.softDelete(id, actor, context);
  }

  @Patch(':id/restore')
  restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminLanguagesService.restore(id, actor, context);
  }
}
