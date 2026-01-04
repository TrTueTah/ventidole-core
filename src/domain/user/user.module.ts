import { StreamChatModule } from '@domain/stream-chat/stream-chat.module';
import { Module } from '@nestjs/common';
import { AddressModule } from './address/address.module';
import { CommentModule } from './comment/comment.module';
import { CommunityModule } from './community/community.module';
import { PostModule } from './post/post.module';
import { ShopModule } from './shop/shop.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    PostModule,
    CommentModule,
    CommunityModule,
    ShopModule,
    AddressModule,
    StreamChatModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
