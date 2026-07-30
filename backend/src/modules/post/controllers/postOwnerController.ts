import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Ip, Headers } from '@nestjs/common';
import { PostOwnerService } from '../services/postOwnerService';
import { CreatePostDto, UpdatePostDto, QueryOwnerPostDto } from '../validations/postValidation';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { RoleName } from 'common/enums/database.enums';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';

@Controller('owner/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.BlogOwner)
export class PostOwnerController {
  constructor(private readonly postOwnerService: PostOwnerService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryOwnerPostDto,
  ) {
    return this.postOwnerService.findAll(user.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.postOwnerService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.postOwnerService.create(user, dto, ipAddress, userAgent);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.postOwnerService.update(user, id, dto, ipAddress, userAgent);
  }

  @Delete(':id')
  softDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.postOwnerService.softDelete(user, id, ipAddress, userAgent);
  }

  @Post(':id/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.postOwnerService.submit(user, id, ipAddress, userAgent);
  }
}
