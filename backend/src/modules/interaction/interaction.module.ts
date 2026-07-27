import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './models/comment';
import { PostLike } from './models/postLike';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, PostLike])],
  exports: [TypeOrmModule],
})
export class InteractionModule {}
