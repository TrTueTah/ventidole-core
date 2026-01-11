import { SubscriptionAggregate } from './subscription.aggregate';
import { SubscriptionId } from '@domain/shared/value-objects/subscription-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';

/**
 * Subscription Repository Interface
 *
 * Domain layer contract for subscription persistence.
 * Infrastructure layer must implement this interface.
 */
export interface SubscriptionRepository {
  /**
   * Persist subscription (create or update)
   */
  save(subscription: SubscriptionAggregate): Promise<void>;

  /**
   * Find subscription by ID
   */
  findById(id: SubscriptionId): Promise<SubscriptionAggregate | null>;

  /**
   * Find subscription by user and community
   * Business rule: One subscription per user per community
   */
  findByUserAndCommunity(
    userId: UserId,
    communityId: CommunityId,
  ): Promise<SubscriptionAggregate | null>;

  /**
   * Find all subscriptions for a user (paginated)
   * Used for "My Subscriptions" page
   */
  findByUser(
    userId: UserId,
    params: { page: number; limit: number },
  ): Promise<{ subscriptions: SubscriptionAggregate[]; total: number }>;

  /**
   * Find all subscriptions for a community (paginated)
   * Used for community owner to see subscribers
   */
  findByCommunity(
    communityId: CommunityId,
    params: { page: number; limit: number },
  ): Promise<{ subscriptions: SubscriptionAggregate[]; total: number }>;

  /**
   * Check if user has active subscription to community
   * Used for access control policy
   */
  hasActiveSubscription(
    userId: UserId,
    communityId: CommunityId,
  ): Promise<boolean>;

  /**
   * Find subscriptions expiring before a certain date
   * Used for renewal reminders and batch processing
   */
  findExpiringSubscriptions(
    beforeDate: Date,
  ): Promise<SubscriptionAggregate[]>;

  /**
   * Find subscription by PayOS order code
   * Used for webhook processing
   */
  findByOrderCode(orderCode: number): Promise<SubscriptionAggregate | null>;
}
