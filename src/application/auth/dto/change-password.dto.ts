import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Change Password DTO
 *
 * Request DTO for changing password (authenticated user).
 */
export class ChangePasswordDto {
  @ApiProperty({ example: 'OldSecurePass123!' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NewSecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
