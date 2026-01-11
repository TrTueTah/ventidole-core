import { ApiProperty } from '@nestjs/swagger';

/**
 * User Info DTO (nested in Auth Response)
 */
export class UserInfoDto {
  @ApiProperty({ example: 'user_123' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'FAN' })
  role: string;
}

/**
 * Auth Response DTO
 *
 * Response DTO for authentication endpoints.
 */
export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ type: UserInfoDto })
  user: UserInfoDto;
}

/**
 * Token Response DTO
 *
 * Response DTO for token refresh.
 */
export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;
}

/**
 * Verification Code Response DTO
 *
 * Response DTO for send verification endpoint.
 */
export class VerificationCodeResponseDto {
  @ApiProperty({
    description: 'Expiration timestamp',
    example: 1740412406898,
    type: Number,
  })
  expiresAt: number;
}
