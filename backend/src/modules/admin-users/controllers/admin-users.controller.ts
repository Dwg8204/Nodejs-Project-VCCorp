import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { AdminUsersService } from '../services/admin-users.service';
import {
  ChangeUserRoleDto,
  CreateAdminUserDto,
  QueryAdminUsersDto,
  UpdateAdminUserDto,
} from '../validations/admin-users.validation';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SuperAdmin)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll(@Query() dto: QueryAdminUsersDto) {
    return this.adminUsersService.findAll(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateAdminUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminUsersService.create(dto, actor, context);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminUsersService.update(id, dto, actor, context);
  }

  @Patch(':id/role')
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeUserRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminUsersService.changeRole(id, dto, actor, context);
  }

  @Patch(':id/lock')
  lock(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminUsersService.lock(id, actor, context);
  }

  @Patch(':id/unlock')
  unlock(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.adminUsersService.unlock(id, actor, context);
  }
}
