import { ApiProperty } from "@nestjs/swagger";
import { REGEX_USER_PASSWORD } from "@shared/constant/regex.constant";
import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class ResetPasswordRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(REGEX_USER_PASSWORD)
  @ApiProperty({ 
    example: "Password@123456",
    description: "Your new password",
    type: String
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: "example@gmail.com",
    description: "Your email address",
    type: String,
  })
  email: string;
}
