import { Module } from '@nestjs/common';
import { AdminIdolsController } from './admin-idols.controller';
import { AdminIdolsService } from './admin-idols.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AdminIdolsController],
  providers: [AdminIdolsService, PrismaService],
  exports: [AdminIdolsService],
})
export class AdminIdolsModule {}