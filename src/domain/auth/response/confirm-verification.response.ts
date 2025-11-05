import { ApiProperty } from "@nestjs/swagger";
import { Role } from "src/db/prisma/enums";

export class ConfirmVerificationResponse {
  @ApiProperty({
    example: '1',
    description: 'User ID',
    type: String,
  })
  id: string;

  @ApiProperty({
    example: 'Leon',
    required: false,
    description: 'User name',
    type: String,
    nullable: true,
  })
  name?: string;

  @ApiProperty({
    example: 'example@gmail.com',
    description: 'User email',
    type: String,
  })
  email: string;

  @ApiProperty({
    example: Role.FAN,
    description: 'User role',
    enum: [Role.FAN, Role.ADMIN, Role.IDOL],
    type: String,
  })
  role: Role;
}