import { ApiProperty } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty({
    description: 'Stream Chat authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Stream Chat API key',
    example: 'sy25rkkujgdv',
  })
  apiKey: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user_123',
  })
  userId: string;
}
