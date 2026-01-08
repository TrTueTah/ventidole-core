import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminCreatePostDto {
  @ApiProperty({
    example: 'This is a post content',
    description: 'Post content',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Post media URLs',
  })
  @IsOptional()
  mediaUrls?: any;

  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'Author ID',
  })
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'Community ID',
  })
  @IsString()
  @IsNotEmpty()
  communityId: string;

  @ApiPropertyOptional({
    example: {},
    description: 'Post metadata',
  })
  @IsOptional()
  metadata?: any;
}
