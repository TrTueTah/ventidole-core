import { Module } from '@nestjs/common';
import { AdminCommunityModule } from './community/admin-community.module';
import { AdminUserModule } from './user/admin-user.module';

@Module({
  imports: [AdminUserModule, AdminCommunityModule],
})
export class AdminModule {}
