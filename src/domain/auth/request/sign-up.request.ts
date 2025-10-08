import { ApiProperty } from "@nestjs/swagger";
import { REGEX_USER_PASSWORD } from "@shared/constant/regex.constant";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { Role } from "src/generated/prisma/enums";
import { AccountModel } from "src/generated/prisma/models";

export class SignUpRequest {
  @ApiProperty({
    example: 'example@gmail.com',
    description: 'Your email',
    type: String,
  })
  @Transform(({ value }) => typeof value === 'string' && value.toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password@123456',
    description: 'Your password',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(REGEX_USER_PASSWORD)
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Your full name',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Your phone number',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  static toCreateInput(request: SignUpRequest, hashedPassword: string) {
    return {
      name: request.name,
      email: request.email,
      password: hashedPassword,
      phoneNumber: request.phoneNumber,
      role: Role.FAN,
    } as AccountModel;
  }
}
