import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetUserRequest {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID (optional, if not provided, returns current user)',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;
}
