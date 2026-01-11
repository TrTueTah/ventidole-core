import { IsEmail, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationType } from './send-verification.dto';

/**
 * Confirm Verification DTO
 *
 * Request DTO for confirming verification code.
 */
export class ConfirmVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;

  @ApiProperty({
    enum: VerificationType,
    example: VerificationType.REGISTER_ACCOUNT,
  })
  @IsEnum(VerificationType)
  verificationType: VerificationType;
}
