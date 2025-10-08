import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SignInRequest {
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
    type: String 
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
