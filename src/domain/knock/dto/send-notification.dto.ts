import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({
    description: 'Array of recipient user IDs',
    example: ['user_123', 'user_456'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({
    description: 'Notification title',
    example: 'New Message',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification text content',
    example: 'You have a new message from John Doe',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the notification',
    example: { url: '/messages/123', type: 'message' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Actor ID (who triggered the notification)',
    example: 'user_789',
  })
  @IsString()
  @IsOptional()
  actorId?: string;
}
