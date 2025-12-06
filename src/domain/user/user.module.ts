import { Module } from '@nestjs/common';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [PostModule, CommentModule, CommunityModule],
})
export class UserModule {}
