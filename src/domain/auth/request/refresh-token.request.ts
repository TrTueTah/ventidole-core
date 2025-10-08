import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ 
    description: "Your access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY4ODUwMjM0NSwiZXhwIjoxNjg4NTg4NzQ1fQ.7mXhKfXlqH3p0nO2b8jv8XzF1Zz5Y9bX5tF8vZ6xQ",
    type: String,
  })
  token: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ 
    description: "Your refresh token", 
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY4ODUwMjM0NSwiZXhwIjoxNjg4NTg4NzQ1fQ.7mXhKfXlqH3p0nO2b8jv8XzF1Zz5Y9bX5tF8vZ6xQ", 
    type: String 
  })
  refreshToken: string;
}
