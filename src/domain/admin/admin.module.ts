import { Module } from '@nestjs/common';
import { AdminChatModule } from './chat/admin-chat.module';
import { AdminCommunityModule } from './community/admin-community.module';
import { AdminOrderModule } from './order/admin-order.module';
import { AdminProductModule } from './product/admin-product.module';
import { AdminShopModule } from './shop/admin-shop.module';
import { AdminUserModule } from './user/admin-user.module';

@Module({
  imports: [
    AdminUserModule,
    AdminCommunityModule,
    AdminShopModule,
    AdminProductModule,
    AdminOrderModule,
    AdminChatModule,
  ],
})
export class AdminModule {}
