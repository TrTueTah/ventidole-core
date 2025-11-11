import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, IsOptional } from "class-validator";

export class CreateGroupRequest {
  @ApiProperty({
    example: 'StarLight',
    description: 'Group name',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  groupName: string;

  @ApiPropertyOptional({
    example: 'A talented K-pop group known for their powerful performances',
    description: 'Group description',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/bucket/logo.jpg',
    description: 'Group logo URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/bucket/background.jpg',
    description: 'Group background image URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  backgroundUrl?: string;
}
