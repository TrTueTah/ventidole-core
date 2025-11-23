import { Module } from "@nestjs/common";
import { PrismaModule } from "@shared/service/prisma/prisma.module";
import { CommunityController } from "./community.controller";
import { CommunityService } from "./community.service";

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}