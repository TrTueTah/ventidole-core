import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminCommunitiesModule } from './communities/admin-communities.module';
import { AdminIdolsModule } from './idols/admin-idols.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminStatisticsModule } from './statistics/admin-statistics.module';
import { ProductModule } from './products/product.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminCommunitiesModule,
    AdminIdolsModule,
    AdminUsersModule,
    AdminStatisticsModule,
    ProductModule,
  ],
})
export class AdminModule {}
