import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommunityDto {
  @ApiPropertyOptional({
    example: 'K-Pop Fans Community',
    description: 'Community name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

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

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the community is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
