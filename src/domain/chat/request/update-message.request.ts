import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMessageRequest {
  @ApiProperty({
    description: 'Message ID to update',
  })
  @IsNotEmpty()
  @IsString()
  messageId: string;

  @ApiProperty({
    description: 'New message content',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
