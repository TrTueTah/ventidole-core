import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { CommentModule } from './comment/comment.module';
import { CommunityModule } from './community/community.module';
import { PostModule } from './post/post.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PostModule, CommentModule, CommunityModule, ChatModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
