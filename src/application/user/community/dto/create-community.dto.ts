import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Create Community DTO
 *
 * Request DTO for creating a new community.
 */
export class CreateCommunityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsEnum(['SOLO', 'GROUP'])
  type: 'SOLO' | 'GROUP';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
