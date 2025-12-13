import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateShopDto {
  @ApiProperty({
    example: 'My Shop',
    description: 'Shop name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'A shop description',
    description: 'Shop description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Shop avatar URL',
  })
  @IsUrl()
  @IsOptional()
  @MaxLength(255)
  avatarUrl?: string;

  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'Community ID',
  })
  @IsString()
  @IsNotEmpty()
  communityId: string;
}
