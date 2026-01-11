import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Register DTO
 *
 * Request DTO for user registration.
 */
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'FAN', enum: ['FAN', 'IDOL'] })
  @IsOptional()
  @IsEnum(['FAN', 'IDOL'])
  role?: 'FAN' | 'IDOL';
}
