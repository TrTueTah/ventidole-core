import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export class CreatePostRequest {
  @ApiProperty({
    description: 'Post content/caption',
    example: 'Beautiful sunset at the beach! 🌅 #nature #sunset',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

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
    description: 'Mentioned user IDs',
    example: ['user-id-1', 'user-id-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentions?: string[];

  @ApiPropertyOptional({
    description: 'Location/place name',
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