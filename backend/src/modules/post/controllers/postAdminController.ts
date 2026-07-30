import { Controller, Get, Post, Param, Body, Query, UseGuards, Ip, Headers } from '@nestjs/common';
import { PostAdminService } from '../services/postAdminService';
import { QueryAdminPostDto, RejectPostDto } from '../validations/postValidation';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { RoleName } from 'common/enums/database.enums';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';

@Controller('admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SuperAdmin)
export class PostAdminController {
  constructor(private readonly postAdminService: PostAdminService) {}

  @Get()
  findAll(@Query() query: QueryAdminPostDto) {
    return this.postAdminService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postAdminService.findOne(id);
  }

  @Post(':id/approve')
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.postAdminService.approve(user, id, ipAddress, userAgent);
  }

  @Post(':id/unapprove')
  unapprove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.postAdminService.unapprove(user, id, ipAddress, userAgent);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectPostDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.postAdminService.reject(user, id, dto, ipAddress, userAgent);
  }
}
