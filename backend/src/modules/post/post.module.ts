import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './models/post';
import { PostTranslation } from './models/postTranslation';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostTranslation])],
  exports: [TypeOrmModule],
})
export class PostModule {}
