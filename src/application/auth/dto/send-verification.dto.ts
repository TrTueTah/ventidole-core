import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VerificationType {
  REGISTER_ACCOUNT = 'REGISTER_ACCOUNT',
  RESET_PASSWORD = 'RESET_PASSWORD',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  FIND_EMAIL = 'FIND_EMAIL',
}

/**
 * Send Verification DTO
 *
 * Request DTO for sending verification code.
 */
export class SendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: VerificationType,
    example: VerificationType.REGISTER_ACCOUNT,
  })
  @IsEnum(VerificationType)
  verificationType: VerificationType;
}
