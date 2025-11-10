import { ApiProperty } from "@nestjs/swagger";
import { REGEX_USER_PASSWORD } from "@shared/constant/regex.constant";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { Role } from "src/db/prisma/enums";
import { UserModel } from "src/db/prisma/models";

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
    example: 'johndoe',
    description: 'Your username',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  static toCreateInput(request: SignUpRequest, hashedPassword: string) {
    return {
      email: request.email,
      password: hashedPassword,
      role: Role.FAN,
    } as UserModel;
  }
}
