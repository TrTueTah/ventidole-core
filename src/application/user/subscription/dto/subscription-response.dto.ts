/**
 * DTO for subscription response
 */
export class SubscriptionResponseDto {
  id: string;
  userId: string;
  tierId: string;
  communityId: string;
  communityName: string;
  tierName: string;
  status: string;
  billingCycle: string;
  price: number;
  currency: string;
  startDate: Date;
  nextBillingDate: Date;
  expirationDate: Date | null;
  canceledAt: Date | null;
  paymentLinkId?: string | null;
  checkoutUrl?: string | null;
  qrCode?: string | null;
  orderCode?: number | null;
  paidAt?: Date | null;
  createdAt: Date;
}
