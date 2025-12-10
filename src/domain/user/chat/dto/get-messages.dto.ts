import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class GetMessagesDto {
  @ApiPropertyOptional({
    example: 50,
    description: 'Number of messages to retrieve',
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    example: 'msg_123',
    description: 'Message ID to start from (for pagination)',
  })
  @IsOptional()
  @Type(() => String)
  messageId?: string;
}
