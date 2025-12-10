import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateStreamUserDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsUrl()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    description: 'User role',
    example: 'user',
    default: 'user',
  })
  @IsString()
  @IsOptional()
  role?: string;
}
