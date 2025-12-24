import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/service/prisma/prisma.module';
import { RecommendationModule } from '@shared/service/recommendation/recommendation.module';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [PrismaModule, RecommendationModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
