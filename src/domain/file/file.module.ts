import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FirebaseModule } from '../../shared/service/firebase/firebase.module';
import { JwtStrategy } from '@shared/service/token/jwt.strategy';
import { PrismaService } from '@shared/service/prisma/prisma.service';

/**
 * File Module - Global module for file operations
 * 
 * Provides:
 * - File upload to Firebase Storage
 * - File deletion
 * - File URL generation (public and signed)
 * - File validation
 * - Multiple file operations
 * 
 * Uses Firebase Storage for cloud file management
 */
@Global()
@Module({
  imports: [
    FirebaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [FileController],
  providers: [FileService, JwtStrategy, PrismaService],
  exports: [FileService],
})
export class FileModule {}
