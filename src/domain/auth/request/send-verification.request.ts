import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";
import { VerificationType } from "src/db/prisma/enums";

export class SendVerificationRequest {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ 
    example: "user@example.com",
    description: "Your email address",
    type: String,
  })
  email?: string;

  @IsNotEmpty()
  @IsEnum(VerificationType)
  @ApiProperty({
    enum: VerificationType,
    description: "Verification behavior",
    example: VerificationType.REGISTER_ACCOUNT,
  })
  verificationType: VerificationType;
}
