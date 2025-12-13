import { Module } from '@nestjs/common';
import { AdminCommunityModule } from './community/admin-community.module';
import { AdminShopModule } from './shop/admin-shop.module';
import { AdminUserModule } from './user/admin-user.module';

@Module({
  imports: [AdminUserModule, AdminCommunityModule, AdminShopModule],
})
export class AdminModule {}
