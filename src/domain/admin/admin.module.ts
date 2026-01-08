import { Module } from '@nestjs/common';
import { AdminCommunityModule } from './community/admin-community.module';
import { AdminOrderModule } from './order/admin-order.module';
import { AdminPostModule } from './post/admin-post.module';
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
    AdminPostModule,
  ],
})
export class AdminModule {}
