import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MarkAsReadRequest {
  @ApiProperty({ 
    description: 'Chat channel ID',
  })
  @IsNotEmpty()
  @IsString()
  channelId: string;

  @ApiProperty({ 
    description: 'Last message ID that was read',
    required: false,
  })
  @IsString()
  lastMessageId?: string;
}
