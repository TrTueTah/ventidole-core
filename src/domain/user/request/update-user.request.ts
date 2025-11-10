import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateUserRequest {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'User email',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    example: 'device-token-xyz123',
    description: 'Device token for push notifications',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  deviceToken?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Online status',
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
}
