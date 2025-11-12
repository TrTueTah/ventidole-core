import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReplyRequest {
  @ApiProperty({
    description: 'Comment ID to reply to',
    example: 'comment-clx456def',
  })
  @IsString()
  @IsNotEmpty()
  commentId: string;

  @ApiProperty({
    description: 'Reply content',
    example: 'Thank you! 😊',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
