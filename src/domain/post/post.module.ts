import { Module } from "@nestjs/common";
import { PostController } from "./post.controller";
import { PostService } from "./post.service";
import { PrismaModule } from "@shared/service/prisma/prisma.module";
import { FirebaseModule } from "@shared/service/firebase/firebase.module";

@Module({
  imports: [
    PrismaModule,
    FirebaseModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}