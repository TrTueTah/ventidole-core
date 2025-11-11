import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class AdminSignupRequest {
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
    description: 'Admin password (min 6 characters)',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Admin Name',
    description: 'Admin name/username',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
