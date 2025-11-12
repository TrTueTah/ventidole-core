import { Module } from "@nestjs/common";
import { ReplyController } from "./reply.controller";
import { ReplyService } from "./reply.service";
import { PrismaModule } from "@shared/service/prisma/prisma.module";
import { FirebaseModule } from "@shared/service/firebase/firebase.module";

@Module({
  imports: [
    PrismaModule,
    FirebaseModule,
  ],
  controllers: [ReplyController],
  providers: [ReplyService],
  exports: [ReplyService],
})
export class ReplyModule {}
