import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SubscriptionRepository } from '@domain/membership/subscription/subscription.repository';
import { MembershipTierRepository } from '@domain/membership/membership-tier/membership-tier.repository';
import { SubscriptionAggregate } from '@domain/membership/subscription/subscription.aggregate';
import { SubscriptionId } from '@domain/shared/value-objects/subscription-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { CanManageCommunityPolicy } from '@domain/community/community/policies/can-manage-community.policy';
import { PageInfo, PaginationResponse } from '@application/shared/dto/pagination.dto';
import {
  CreateSubscriptionDto,
  SubscriptionResponseDto,
} from './dto';
import { PrismaService } from '@infra/prisma/prisma.service';
import { PayOSService } from '@infra/payos/payos.service';
import { ConfigService } from '@nestjs/config';

/**
 * Subscription Application Service
 *
 * Orchestrates subscription use cases.
 *
 * Responsibilities:
 * - Coordinate policies, repositories, and domain logic
 * - Map between DTOs and domain aggregates
 * - Handle application-level concerns
 *
 * Pattern:
 * 1. Check policy
 * 2. Load aggregate
 * 3. Execute business logic
 * 4. Persist
 * 5. Return DTO
 */
@Injectable()
export class SubscriptionApplicationService {
  constructor(
    @Inject('SubscriptionRepository')
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject('MembershipTierRepository')
    private readonly tierRepository: MembershipTierRepository,
    private readonly canManageCommunity: CanManageCommunityPolicy,
    private readonly prisma: PrismaService,
    private readonly payosService: PayOSService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Subscribe to a community tier
   * Creates PayOS payment link and returns QR code for payment
   */
  async subscribe(
    userId: string,
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    // 1. Check if tier exists
    const tier = await this.tierRepository.findByCommunity(
      CommunityId.fromString(dto.communityId),
    );

    if (!tier) {
      throw new NotFoundException('Membership tier not found for this community');
    }

    if (!tier.isActive) {
      throw new Error('Membership tier is not active');
    }

    // 2. Check if user already has subscription
    const existingSubscription = await this.subscriptionRepository.findByUserAndCommunity(
      UserId.fromString(userId),
      CommunityId.fromString(dto.communityId),
    );

    if (existingSubscription && existingSubscription.isActive()) {
      throw new Error('User already has an active subscription to this community');
    }

    // 3. Determine price based on billing cycle
    const price =
      dto.billingCycle === 'MONTHLY'
        ? tier.getMonthlyPrice().amount
        : tier.getYearlyPrice().amount;

    // 4. Create PayOS payment link
    const community = await this.prisma.community.findUnique({
      where: { id: dto.communityId },
      select: { name: true },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const orderCode = Date.now(); // Unique order code

    const paymentResponse = await this.payosService.createPayment({
      orderCode,
      amount: price,
      description: `Subscription to ${community?.name || 'community'} - ${dto.billingCycle}`,
      returnUrl: `${frontendUrl}/payment/success?subscriptionId=`,
      cancelUrl: `${frontendUrl}/payment/cancel`,
    });

    // 5. Create subscription with PENDING_PAYMENT status
    const subscription = SubscriptionAggregate.createPending({
      userId,
      tierId: tier.id.value,
      communityId: dto.communityId,
      billingCycle: dto.billingCycle,
      price,
      paymentLinkId: paymentResponse.paymentLinkId,
      checkoutUrl: paymentResponse.checkoutUrl,
      qrCode: paymentResponse.qrCode,
      orderCode,
    });

    // 6. Persist subscription
    // Note: Do NOT increment tier subscriber count yet - will be done after payment confirmation
    await this.subscriptionRepository.save(subscription);

    // 7. Return DTO with payment details
    return this.mapToDto(subscription, tier.name.value, community?.name || 'Unknown');
  }

  /**
   * Cancel subscription
   * User can cancel their own subscription
   */
  async cancelSubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<void> {
    // 1. Load subscription
    const subscription = await this.subscriptionRepository.findById(
      SubscriptionId.fromString(subscriptionId),
    );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // 2. Check ownership
    if (subscription.userId.value !== userId) {
      throw new ForbiddenException('Cannot cancel another user\'s subscription');
    }

    // 3. Cancel subscription
    subscription.cancel();

    // 4. Decrement tier subscriber count
    const tier = await this.tierRepository.findById(subscription.tierId);
    if (tier) {
      tier.decrementSubscriberCount();
      await this.tierRepository.save(tier);
    }

    // 5. Persist
    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Get user's subscriptions (paginated)
   */
  async getMySubscriptions(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResponse<SubscriptionResponseDto>> {
    const { subscriptions, total } = await this.subscriptionRepository.findByUser(
      UserId.fromString(userId),
      { page, limit },
    );

    // Fetch tier and community details for each subscription
    const dtos = await Promise.all(
      subscriptions.map(async (sub) => {
        const tier = await this.tierRepository.findById(sub.tierId);
        const community = await this.prisma.community.findUnique({
          where: { id: sub.communityId.value },
          select: { name: true },
        });

        return this.mapToDto(
          sub,
          tier?.name.value || 'Unknown',
          community?.name || 'Unknown',
        );
      }),
    );

    return {
      data: dtos,
      pageInfo: new PageInfo(page, limit, total),
    };
  }

  /**
   * Get community subscribers (paginated)
   * Only community owner can view
   */
  async getCommunitySubscribers(
    requesterId: string,
    communityId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResponse<SubscriptionResponseDto>> {
    // 1. Check policy
    await this.canManageCommunity.check(requesterId, communityId);

    // 2. Fetch subscriptions
    const { subscriptions, total } = await this.subscriptionRepository.findByCommunity(
      CommunityId.fromString(communityId),
      { page, limit },
    );

    // 3. Fetch tier details
    const tier = await this.tierRepository.findByCommunity(
      CommunityId.fromString(communityId),
    );

    const dtos = subscriptions.map((sub) =>
      this.mapToDto(sub, tier?.name.value || 'Unknown', communityId),
    );

    return {
      data: dtos,
      pageInfo: new PageInfo(page, limit, total),
    };
  }

  /**
   * Check if user has active subscription to community
   */
  async checkSubscriptionStatus(
    userId: string,
    communityId: string,
  ): Promise<{ hasAccess: boolean; subscription: SubscriptionResponseDto | null }> {
    const subscription = await this.subscriptionRepository.findByUserAndCommunity(
      UserId.fromString(userId),
      CommunityId.fromString(communityId),
    );

    if (!subscription || !subscription.isActive()) {
      return { hasAccess: false, subscription: null };
    }

    const tier = await this.tierRepository.findById(subscription.tierId);
    const dto = this.mapToDto(
      subscription,
      tier?.name.value || 'Unknown',
      communityId,
    );

    return { hasAccess: true, subscription: dto };
  }

  /**
   * Map aggregate to DTO
   */
  private mapToDto(
    subscription: SubscriptionAggregate,
    tierName: string,
    communityName: string,
  ): SubscriptionResponseDto {
    return {
      id: subscription.id.value,
      userId: subscription.userId.value,
      tierId: subscription.tierId.value,
      communityId: subscription.communityId.value,
      communityName,
      tierName,
      status: subscription.status.value,
      billingCycle: subscription.billingCycle.value,
      price: subscription.price.amount,
      currency: 'VND',
      startDate: subscription.startDate,
      nextBillingDate: subscription.nextBillingDate,
      expirationDate: subscription.expirationDate,
      canceledAt: subscription.canceledAt,
      paymentLinkId: subscription.paymentLinkId,
      checkoutUrl: subscription.checkoutUrl,
      qrCode: subscription.qrCode,
      orderCode: subscription.orderCode,
      paidAt: subscription.paidAt,
      createdAt: subscription.createdAt,
    };
  }
}
