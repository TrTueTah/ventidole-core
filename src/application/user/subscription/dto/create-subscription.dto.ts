import { IsString, IsEnum, IsOptional } from 'class-validator';

/**
 * DTO for creating a subscription
 */
export class CreateSubscriptionDto {
  @IsString()
  communityId: string;

  @IsEnum(['MONTHLY', 'YEARLY'])
  billingCycle: 'MONTHLY' | 'YEARLY';

  @IsEnum(['CREDIT', 'COD'])
  @IsOptional()
  paymentMethod?: 'CREDIT' | 'COD';
}
