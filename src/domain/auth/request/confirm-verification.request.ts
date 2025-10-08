import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { VerificationType } from "src/generated/prisma/enums";

export class ConfirmVerificationRequest {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ 
    example: "example@gmail.com",
    description: "Your email address",
    type: String,
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "Your verification code", example: "0303", type: String })
  code: string;

  @IsNotEmpty()
  @IsEnum(VerificationType)
  @ApiProperty({
    enum: VerificationType,
    description: "Verification type",
    example: VerificationType.FIND_EMAIL,
  })
  verificationType: VerificationType;
}
