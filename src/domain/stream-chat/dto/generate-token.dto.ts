import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateTokenDto {
  @ApiProperty({
    description: 'User ID for token generation',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
