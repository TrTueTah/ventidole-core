import { EventBus } from '@core/event/event-bus.service';
import { CommunityAggregate } from '@domain/community/community/community.aggregate';
import { CommunityRepository } from '@domain/community/community/community.repository';
import { CommunityName } from '@domain/community/community/value-objects/community-name.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/**
 * Community Repository Prisma Implementation
 *
 * Implements CommunityRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve communities
 * - Publish domain events after persistence
 */
@Injectable()
export class CommunityRepositoryPrisma implements CommunityRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(community: CommunityAggregate): Promise<void> {
    const data = this.toPersistence(community);

    // Upsert community
    await this.prisma.community.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        name: data.name,
        communityType: data.communityType,
        description: data.description,
        avatarUrl: data.avatarUrl,
        backgroundUrl: data.backgroundUrl,
        followerCount: data.followerCount,
        postCount: data.postCount,
        isActive: data.isActive,
        isDeleted: data.isDeleted,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        name: data.name,
        description: data.description,
        avatarUrl: data.avatarUrl,
        backgroundUrl: data.backgroundUrl,
        followerCount: data.followerCount,
        postCount: data.postCount,
        isActive: data.isActive,
        isDeleted: data.isDeleted,
        updatedAt: data.updatedAt,
      },
    });

    // Sync followers
    await this.syncFollowers(community);

    // Publish domain events
    const events = community.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    community.clearDomainEvents();
  }

  async findById(id: CommunityId): Promise<CommunityAggregate | null> {
    const community = await this.prisma.community.findUnique({
      where: { id: id.value },
      include: {
        followers: {
          select: {
            userId: true,
            followedAt: true,
          },
        },
      },
    });

    if (!community) {
      return null;
    }

    return this.fromPersistence(community);
  }

  async findByIds(ids: string[]): Promise<CommunityAggregate[]> {
    if (ids.length === 0) {
      return [];
    }

    const communities = await this.prisma.community.findMany({
      where: {
        id: { in: ids },
        isDeleted: false,
      },
      // Don't load followers for bulk operations - will be loaded separately if needed
      include: {
        followers: false,
      },
    });

    // Map without followers - more efficient for bulk operations
    return communities.map((c) => this.fromPersistence({ ...c, followers: [] }));
  }

  async findByName(name: CommunityName): Promise<CommunityAggregate | null> {
    const community = await this.prisma.community.findUnique({
      where: { name: name.value },
      include: {
        followers: {
          select: {
            userId: true,
            followedAt: true,
          },
        },
      },
    });

    if (!community) {
      return null;
    }

    return this.fromPersistence(community);
  }

  async existsByName(
    name: CommunityName,
    excludeId?: CommunityId,
  ): Promise<boolean> {
    const community = await this.prisma.community.findUnique({
      where: { name: name.value },
      select: { id: true },
    });

    if (!community) {
      return false;
    }

    if (excludeId && community.id === excludeId.value) {
      return false;
    }

    return true;
  }

  async findFollowedByUser(userId: UserId): Promise<CommunityAggregate[]> {
    const communities = await this.prisma.community.findMany({
      where: {
        followers: {
          some: {
            userId: userId.value,
          },
        },
        isDeleted: false,
      },
      // Only include the current user's follower record, not all followers
      include: {
        followers: {
          where: {
            userId: userId.value,
          },
          select: {
            userId: true,
            followedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return communities.map((c) => this.fromPersistence(c));
  }

  async checkAlreadyFollowing(
    userId: string,
    communityIds: string[],
  ): Promise<Set<string>> {
    if (communityIds.length === 0) {
      return new Set();
    }

    const follows = await this.prisma.communityFollower.findMany({
      where: {
        userId,
        communityId: { in: communityIds },
      },
      select: {
        communityId: true,
      },
    });

    return new Set(follows.map((f) => f.communityId));
  }

  async findAll(params: {
    page: number;
    limit: number;
    type?: string;
    isActive?: boolean;
    searchTerm?: string;
  }): Promise<{ communities: CommunityAggregate[]; total: number }> {
    const where: any = {
      isDeleted: false,
    };

    if (params.type) {
      where.communityType = params.type;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.searchTerm) {
      where.OR = [
        { name: { contains: params.searchTerm, mode: 'insensitive' } },
        {
          description: { contains: params.searchTerm, mode: 'insensitive' },
        },
      ];
    }

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        include: {
          followers: {
            select: {
              userId: true,
              followedAt: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.community.count({ where }),
    ]);

    return {
      communities: communities.map((c) => this.fromPersistence(c)),
      total,
    };
  }

  async delete(id: CommunityId): Promise<void> {
    await this.prisma.community.update({
      where: { id: id.value },
      data: {
        isActive: false,
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Sync followers between aggregate and database
   */
  private async syncFollowers(community: CommunityAggregate): Promise<void> {
    const communityId = community.id.value;
    const currentFollowers = community.getFollowers();

    // Get existing followers from database
    const existingFollowers = await this.prisma.communityFollower.findMany({
      where: { communityId },
      select: { userId: true },
    });

    const existingUserIds = new Set(existingFollowers.map((f) => f.userId));
    const currentUserIds = new Set(currentFollowers.map((f) => f.userId.value));

    // Determine followers to add
    const toAdd = currentFollowers.filter(
      (f) => !existingUserIds.has(f.userId.value),
    );

    // Determine followers to remove
    const toRemove = existingFollowers.filter(
      (f) => !currentUserIds.has(f.userId),
    );

    // Add new followers
    if (toAdd.length > 0) {
      await this.prisma.communityFollower.createMany({
        data: toAdd.map((f) => ({
          communityId,
          userId: f.userId.value,
          followedAt: f.followedAt,
        })),
        skipDuplicates: true,
      });
    }

    // Remove old followers
    if (toRemove.length > 0) {
      await this.prisma.communityFollower.deleteMany({
        where: {
          communityId,
          userId: {
            in: toRemove.map((f) => f.userId),
          },
        },
      });
    }
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private fromPersistence(data: any): CommunityAggregate {
    return CommunityAggregate.fromPersistence({
      id: data.id,
      name: data.name,
      type: data.communityType,
      description: data.description,
      avatarUrl: data.avatarUrl,
      backgroundUrl: data.backgroundUrl,
      followerCount: data.followerCount,
      postCount: data.postCount,
      isActive: data.isActive,
      isDeleted: data.isDeleted,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      followers: data.followers || [],
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(community: CommunityAggregate): any {
    return {
      id: community.id.value,
      name: community.name.value,
      communityType: community.type.value,
      description: community.description,
      avatarUrl: community.avatarUrl,
      backgroundUrl: community.backgroundUrl,
      followerCount: community.followerCount,
      postCount: community.postCount,
      isActive: community.isActive,
      isDeleted: community.isDeleted,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };
  }
}
