import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '@shared/enum/message.enum';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export class SendMessageRequest {
  @ApiProperty({ 
    description: 'Chat channel ID',
  })
  @IsNotEmpty()
  @IsString()
  channelId: string;

  @ApiProperty({ 
    enum: MessageType,
    description: 'Type of message',
  })
  @IsNotEmpty()
  @IsEnum(MessageType)
  type: MessageType;

  @ApiProperty({ 
    description: 'Message content',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ 
    description: 'Media URL (for image, video, audio, file)',
    required: false,
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({ 
    description: 'Thumbnail URL (for video)',
    required: false,
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ 
    description: 'Additional metadata',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ 
    description: 'Message ID to reply to',
    required: false,
  })
  @IsOptional()
  @IsString()
  replyTo?: string;
}
