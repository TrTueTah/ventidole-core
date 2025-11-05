import { ApiProperty } from "@nestjs/swagger";
import { Role } from "src/db/prisma/enums";

export class SignInResponse {
  @ApiProperty({ 
    example: "1", 
    description: "User ID",
    type: String
  })
  id: string;

  @ApiProperty({ 
    example: Role.FAN, 
    description: "User role",
    enum: [Role.FAN, Role.ADMIN, Role.IDOL],
    type: String
  })
  role: Role;

  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: "JWT access token",
    type: String
  })
  accessToken: string;

  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: "JWT refresh token", 
    type: String
  })
  refreshToken: string;
}
