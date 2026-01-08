import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostReportDto {
  @ApiProperty({
    description: 'ID of the post being reported',
    example: 'clx1234567890abcdefgh',
  })
  @IsNotEmpty()
  @IsString()
  postId: string;

  @ApiPropertyOptional({
    description: 'Reason for reporting the post',
    example: 'This post contains inappropriate content',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
