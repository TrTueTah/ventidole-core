import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for updating tier details
 */
export class UpdateTierDetailsDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
