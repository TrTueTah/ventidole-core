import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'Updated post content',
    description: 'Post content',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    example: [
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1762054385/kt1-6905e9f7e7ad5_z2wfqq.jpg',
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1763017396/BTS-scaled_wdnws5.jpg',
    ],
    description: 'Array of media URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}
