import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Update Community DTO
 *
 * Request DTO for updating community profile.
 */
export class UpdateCommunityDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  backgroundUrl?: string | null;
}
