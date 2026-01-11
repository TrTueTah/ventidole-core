import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for creating a membership tier
 */
export class CreateTierDto {
  @IsString()
  communityId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(1000) // Min 1,000 VND
  monthlyPrice: number;

  @IsNumber()
  @Min(1000)
  yearlyPrice: number;
}
