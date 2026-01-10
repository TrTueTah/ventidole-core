import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UserRepository } from '@domain/identity/user/user.repository';
import { UserAggregate } from '@domain/identity/user/user.aggregate';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { Email } from '@domain/identity/user/value-objects/email.vo';
import { Username } from '@domain/identity/user/value-objects/username.vo';
import { EventBus } from '@core/event/event-bus.service';

/**
 * User Repository Prisma Implementation
 *
 * Implements the UserRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist user data to database
 * - Publish domain events after persistence
 * - Handle database transactions
 */
@Injectable()
export class UserRepositoryPrisma implements UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(user: UserAggregate): Promise<void> {
    const data = this.toPersistence(user);

    // Upsert user
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role,
        avatarUrl: data.avatarUrl,
        backgroundUrl: data.backgroundUrl,
        bio: data.bio,
        isOnline: data.isOnline,
        lastOnlineAt: data.lastOnlineAt,
        isActive: data.isActive,
        isDeleted: data.isDeleted,
        updatedAt: data.updatedAt,
      },
    });

    // Publish domain events
    const events = user.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // Clear events after publishing
    user.clearDomainEvents();
  }

  async findById(id: UserId): Promise<UserAggregate | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: id.value },
      include: {
        socialAccounts: true,
      },
    });

    if (!user) return null;

    return this.fromPersistence(user);
  }

  async findByEmail(email: Email): Promise<UserAggregate | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.value },
      include: {
        socialAccounts: true,
      },
    });

    if (!user) return null;

    return this.fromPersistence(user);
  }

  async findByUsername(username: Username): Promise<UserAggregate | null> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.value },
      include: {
        socialAccounts: true,
      },
    });

    if (!user) return null;

    return this.fromPersistence(user);
  }

  async existsByEmail(email: Email, excludeId?: UserId): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email: email.value,
        ...(excludeId && { id: { not: excludeId.value } }),
      },
    });

    return count > 0;
  }

  async existsByUsername(username: Username, excludeId?: UserId): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        username: username.value,
        ...(excludeId && { id: { not: excludeId.value } }),
      },
    });

    return count > 0;
  }

  async findAll(params: {
    page: number;
    limit: number;
    role?: string;
    isActive?: boolean;
    searchTerm?: string;
  }): Promise<{ users: UserAggregate[]; total: number }> {
    const skip = (params.page - 1) * params.limit;

    const where: any = {};

    if (params.role) {
      where.role = params.role;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.searchTerm) {
      where.OR = [
        { email: { contains: params.searchTerm, mode: 'insensitive' } },
        { username: { contains: params.searchTerm, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          socialAccounts: true,
        },
        skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => this.fromPersistence(user)),
      total,
    };
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.value },
    });
  }

  /**
   * Map domain aggregate to persistence model
   */
  private toPersistence(user: UserAggregate): any {
    return {
      id: user.id.value,
      email: user.email.value,
      username: user.username.value,
      passwordHash: user.passwordHash.value,
      role: user.role.value,
      avatarUrl: user.profile.avatarUrl,
      backgroundUrl: user.profile.backgroundUrl,
      bio: user.profile.bio,
      isOnline: user.profile.isOnline,
      lastOnlineAt: user.profile.lastOnlineAt,
      isActive: user.isActive,
      isDeleted: user.isDeleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Map persistence model to domain aggregate
   */
  private fromPersistence(data: any): UserAggregate {
    return UserAggregate.fromPersistence({
      id: data.id,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      role: data.role,
      avatarUrl: data.avatarUrl,
      backgroundUrl: data.backgroundUrl,
      bio: data.bio,
      isOnline: data.isOnline,
      lastOnlineAt: data.lastOnlineAt,
      socialAccounts: data.socialAccounts || [],
      isActive: data.isActive,
      isDeleted: data.isDeleted,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
