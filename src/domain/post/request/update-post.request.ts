import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PostVisibility } from './create-post.request';

export class UpdatePostRequest {
  @ApiPropertyOptional({
    description: 'Post content/caption',
    example: 'Updated content: Beautiful sunset at the beach! 🌅 #nature #sunset',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Media URLs (images/videos)',
    example: ['https://storage.googleapis.com/bucket/image1.jpg'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Hashtags',
    example: ['nature', 'sunset', 'photography'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @ApiPropertyOptional({
    description: 'Location',
    example: 'Santa Monica Beach, CA',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Post visibility',
    enum: PostVisibility,
    example: PostVisibility.PUBLIC,
  })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;
}
