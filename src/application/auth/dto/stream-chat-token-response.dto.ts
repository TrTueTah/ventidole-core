import { ApiProperty } from '@nestjs/swagger';

/**
 * Stream Chat Token Response DTO
 *
 * Response containing the Stream Chat authentication token and API key.
 * Frontend uses this to connect to Stream Chat.
 */
export class StreamChatTokenResponseDto {
  @ApiProperty({
    description: 'Stream Chat authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Stream Chat API key',
    example: 'abc123xyz',
  })
  apiKey: string;

  @ApiProperty({
    description: 'User ID for Stream Chat',
    example: 'user_abc123',
  })
  userId: string;
}
