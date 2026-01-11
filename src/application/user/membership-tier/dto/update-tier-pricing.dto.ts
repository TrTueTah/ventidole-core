import { IsNumber, Min } from 'class-validator';

/**
 * DTO for updating tier pricing
 */
export class UpdateTierPricingDto {
  @IsNumber()
  @Min(1000)
  monthlyPrice: number;

  @IsNumber()
  @Min(1000)
  yearlyPrice: number;
}
