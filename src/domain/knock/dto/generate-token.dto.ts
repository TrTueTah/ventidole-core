import { ApiProperty } from '@nestjs/swagger';

export class GenerateKnockTokenDto {
  @ApiProperty({
    description: 'Knock authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'User ID',
    example: 'user_123',
  })
  userId: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;
}
