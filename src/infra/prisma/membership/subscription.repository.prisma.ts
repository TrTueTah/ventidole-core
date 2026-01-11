import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { SubscriptionRepository } from '@domain/membership/subscription/subscription.repository';
import { SubscriptionAggregate } from '@domain/membership/subscription/subscription.aggregate';
import { SubscriptionId } from '@domain/shared/value-objects/subscription-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';

/**
 * Subscription Repository Prisma Implementation
 *
 * Implements SubscriptionRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve subscriptions
 * - Publish domain events after persistence
 */
@Injectable()
export class SubscriptionRepositoryPrisma implements SubscriptionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(subscription: SubscriptionAggregate): Promise<void> {
    const data = this.toPersistence(subscription);

    // Upsert subscription
    await this.prisma.subscription.upsert({
      where: { id: data.id },
      create: data,
      update: {
        status: data.status,
        nextBillingDate: data.nextBillingDate,
        expirationDate: data.expirationDate,
        canceledAt: data.canceledAt,
        paymentLinkId: data.paymentLinkId,
        checkoutUrl: data.checkoutUrl,
        qrCode: data.qrCode,
        orderCode: data.orderCode,
        paidAt: data.paidAt,
        updatedAt: data.updatedAt,
      },
    });

    // Publish domain events
    const events = subscription.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    subscription.clearDomainEvents();
  }

  async findById(id: SubscriptionId): Promise<SubscriptionAggregate | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: id.value },
    });

    if (!subscription) {
      return null;
    }

    return this.toDomain(subscription);
  }

  async findByUserAndCommunity(
    userId: UserId,
    communityId: CommunityId,
  ): Promise<SubscriptionAggregate | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        userId_communityId: {
          userId: userId.value,
          communityId: communityId.value,
        },
      },
    });

    if (!subscription) {
      return null;
    }

    return this.toDomain(subscription);
  }

  async findByUser(
    userId: UserId,
    params: { page: number; limit: number },
  ): Promise<{ subscriptions: SubscriptionAggregate[]; total: number }> {
    const where = {
      userId: userId.value,
      isDeleted: false,
    };

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions: subscriptions.map((s) => this.toDomain(s)),
      total,
    };
  }

  async findByCommunity(
    communityId: CommunityId,
    params: { page: number; limit: number },
  ): Promise<{ subscriptions: SubscriptionAggregate[]; total: number }> {
    const where = {
      communityId: communityId.value,
      isDeleted: false,
    };

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions: subscriptions.map((s) => this.toDomain(s)),
      total,
    };
  }

  async hasActiveSubscription(
    userId: UserId,
    communityId: CommunityId,
  ): Promise<boolean> {
    const count = await this.prisma.subscription.count({
      where: {
        userId: userId.value,
        communityId: communityId.value,
        status: 'ACTIVE',
        isDeleted: false,
      },
    });

    return count > 0;
  }

  async findExpiringSubscriptions(
    beforeDate: Date,
  ): Promise<SubscriptionAggregate[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: {
          lte: beforeDate,
        },
        isDeleted: false,
      },
    });

    return subscriptions.map((s) => this.toDomain(s));
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private toDomain(data: any): SubscriptionAggregate {
    return SubscriptionAggregate.fromPersistence({
      id: data.id,
      userId: data.userId,
      tierId: data.tierId,
      communityId: data.communityId,
      status: data.status,
      billingCycle: data.billingCycle,
      price: data.price,
      startDate: data.startDate,
      nextBillingDate: data.nextBillingDate,
      expirationDate: data.expirationDate,
      canceledAt: data.canceledAt,
      paymentLinkId: data.paymentLinkId,
      checkoutUrl: data.checkoutUrl,
      qrCode: data.qrCode,
      orderCode: data.orderCode,
      paidAt: data.paidAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(subscription: SubscriptionAggregate): any {
    return {
      id: subscription.id.value,
      userId: subscription.userId.value,
      tierId: subscription.tierId.value,
      communityId: subscription.communityId.value,
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
      updatedAt: subscription.updatedAt,
    };
  }

  async findByOrderCode(
    orderCode: number,
  ): Promise<SubscriptionAggregate | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { orderCode },
    });

    if (!subscription) {
      return null;
    }

    return this.toDomain(subscription);
  }
}
