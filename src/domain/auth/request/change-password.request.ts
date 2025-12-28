import { ApiProperty } from '@nestjs/swagger';
import { REGEX_USER_PASSWORD } from '@shared/constant/regex.constant';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Password@123456',
    description: 'Your current password',
    type: String,
  })
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(REGEX_USER_PASSWORD)
  @ApiProperty({
    example: 'NewPassword@123456',
    description: 'Your new password',
    type: String,
  })
  password: string;
}
