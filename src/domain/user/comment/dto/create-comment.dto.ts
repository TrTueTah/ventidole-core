import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'This is a comment',
    description: 'Comment content',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Parent comment ID (for nested replies)',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
