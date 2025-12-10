import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from 'src/db/prisma/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'User email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'john_doe',
    description: 'Username',
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(255)
  password?: string;

  @ApiPropertyOptional({
    example: 'USER',
    description: 'User role',
    enum: Role,
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
    example: true,
    description: 'Whether the user is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
