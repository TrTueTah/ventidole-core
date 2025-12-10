import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from 'src/db/prisma/enums';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiProperty({
    example: 'FAN',
    description: 'User role',
    enum: Role,
    default: Role.FAN,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'User avatar URL',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/background.jpg',
    description: 'User background URL',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  backgroundUrl?: string;

  @ApiPropertyOptional({
    example: 'A short bio about me',
    description: 'User bio',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Community ID (required for FAN role)',
  })
  @IsString()
  @IsOptional()
  communityId?: string;
}
