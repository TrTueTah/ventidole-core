import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AdminUpdatePostDto {
  @ApiPropertyOptional({
    example: 'Updated post content',
    description: 'Post content',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Post media URLs',
  })
  @IsOptional()
  mediaUrls?: any;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the post is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: {},
    description: 'Post metadata',
  })
  @IsOptional()
  metadata?: any;
}
