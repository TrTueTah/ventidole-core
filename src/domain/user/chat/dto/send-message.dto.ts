import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'Message text content',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    example: 'msg_parent_123',
    description: 'Parent message ID (for threaded replies)',
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}
