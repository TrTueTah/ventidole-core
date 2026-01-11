import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Login DTO
 *
 * Request DTO for user login.
 */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com or john_doe' })
  @IsString()
  credential: string; // email or username

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;
}
