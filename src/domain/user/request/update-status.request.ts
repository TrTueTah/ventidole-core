import { ApiProperty } from "@nestjs/swagger";
import { UserStatus } from "@shared/enum/user-status.enum";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class UpdateStatusRequest {
  @ApiProperty({
    example: '123e4567',
    description: 'User ID',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @IsEnum(UserStatus)
  @ApiProperty({
    enum: UserStatus,
    description: 'User status',
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;
}
