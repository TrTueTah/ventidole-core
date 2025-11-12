import { Module } from "@nestjs/common";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";
import { PrismaModule } from "@shared/service/prisma/prisma.module";
import { FirebaseModule } from "@shared/service/firebase/firebase.module";

@Module({
  imports: [
    PrismaModule,
    FirebaseModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
