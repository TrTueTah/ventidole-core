import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'User ID of the message sender',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Message text content',
    example: 'Hello everyone!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}
