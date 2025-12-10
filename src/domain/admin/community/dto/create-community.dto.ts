import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({
    example: 'K-Pop Fans Community',
    description: 'Community name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Community avatar URL',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/background.jpg',
    description: 'Community background URL',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  backgroundUrl?: string;

  @ApiPropertyOptional({
    example: 'A community for K-Pop fans',
    description: 'Community description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
