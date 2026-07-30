import { Controller, Get, Param, Query } from '@nestjs/common';
import { PostPublicService } from '../services/postPublicService';
import { QueryPostDto } from '../validations/postValidation';

@Controller('posts')
export class PostPublicController {
  constructor(private readonly postPublicService: PostPublicService) {}

  @Get()
  findAll(@Query() query: QueryPostDto) {
    return this.postPublicService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postPublicService.findOne(id);
  }
}
