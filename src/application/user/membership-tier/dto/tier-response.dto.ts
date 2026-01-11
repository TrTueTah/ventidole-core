/**
 * DTO for membership tier response
 */
export class TierResponseDto {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  yearlyDiscount: number; // Calculated % discount
  subscriberCount: number;
  isActive: boolean;
  createdAt: Date;
}
