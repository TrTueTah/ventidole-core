import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteMessageRequest {
  @ApiProperty({
    description: 'Message ID to delete',
  })
  @IsNotEmpty()
  @IsString()
  messageId: string;

  @ApiProperty({
    description: 'Channel ID',
  })
  @IsNotEmpty()
  @IsString()
  channelId: string;
}
