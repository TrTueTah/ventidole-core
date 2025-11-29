import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateTokenRequest {
  @ApiProperty({
    description: 'User ID for Stream Chat authentication',
    example: 'user123',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
