import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class AdminLoginRequest {
  @ApiProperty({
    example: 'admin@ventidole.com',
    description: 'Admin email',
    type: String,
  })
  @Transform(({ value }) => typeof value === 'string' && value.toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Admin password',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
