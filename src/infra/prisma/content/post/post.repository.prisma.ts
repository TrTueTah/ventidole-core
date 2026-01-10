import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { PostRepository } from '@domain/content/post/post.repository';
import { PostAggregate } from '@domain/content/post/post.aggregate';
import { PostId } from '@domain/shared/value-objects/post-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';

/**
 * Post Repository Prisma Implementation
 *
 * Implements PostRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve posts
 * - Publish domain events after persistence
 */
@Injectable()
export class PostRepositoryPrisma implements PostRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(post: PostAggregate): Promise<void> {
    const data = this.toPersistence(post);

    // Upsert post
    await this.prisma.post.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        authorId: data.authorId,
        communityId: data.communityId,
        content: data.content,
        likeCount: data.likeCount,
        viewCount: data.viewCount,
        commentCount: data.commentCount,
        isDeleted: data.isDeleted,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        content: data.content,
        likeCount: data.likeCount,
        viewCount: data.viewCount,
        commentCount: data.commentCount,
        isDeleted: data.isDeleted,
        updatedAt: data.updatedAt,
      },
    });

    // Sync media items
    await this.syncMediaItems(post);

    // Publish domain events
    const events = post.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    post.clearDomainEvents();
  }

  async findById(id: PostId): Promise<PostAggregate | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: id.value },
      include: {
        media: {
          select: {
            url: true,
            order: true,
            createdAt: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    return this.fromPersistence(post);
  }

  async findByAuthor(
    authorId: UserId,
    params: { page: number; limit: number },
  ): Promise<{ posts: PostAggregate[]; total: number }> {
    const where = {
      authorId: authorId.value,
      isDeleted: false,
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          media: {
            select: {
              url: true,
              order: true,
              createdAt: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((p) => this.fromPersistence(p)),
      total,
    };
  }

  async findByCommunity(
    communityId: CommunityId,
    params: { page: number; limit: number },
  ): Promise<{ posts: PostAggregate[]; total: number }> {
    const where = {
      communityId: communityId.value,
      isDeleted: false,
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          media: {
            select: {
              url: true,
              order: true,
              createdAt: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((p) => this.fromPersistence(p)),
      total,
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    authorId?: string;
    communityId?: string;
    searchTerm?: string;
  }): Promise<{ posts: PostAggregate[]; total: number }> {
    const where: any = {
      isDeleted: false,
    };

    if (params.authorId) {
      where.authorId = params.authorId;
    }

    if (params.communityId) {
      where.communityId = params.communityId;
    }

    if (params.searchTerm) {
      where.content = {
        contains: params.searchTerm,
        mode: 'insensitive',
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          media: {
            select: {
              url: true,
              order: true,
              createdAt: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((p) => this.fromPersistence(p)),
      total,
    };
  }

  async findForFeed(params: {
    page: number;
    limit: number;
    userId?: string;
  }): Promise<{ posts: PostAggregate[]; total: number }> {
    const where: any = {
      isDeleted: false,
    };

    // TODO: Implement feed logic (e.g., posts from followed communities/users)
    // For now, return all public posts

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          media: {
            select: {
              url: true,
              order: true,
              createdAt: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((p) => this.fromPersistence(p)),
      total,
    };
  }

  async delete(id: PostId): Promise<void> {
    await this.prisma.post.update({
      where: { id: id.value },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Sync media items between aggregate and database
   */
  private async syncMediaItems(post: PostAggregate): Promise<void> {
    const postId = post.id.value;
    const currentMedia = post.getMediaItems();

    // Get existing media from database
    const existingMedia = await this.prisma.postMedia.findMany({
      where: { postId },
      select: { order: true },
    });

    const existingOrders = new Set(existingMedia.map((m) => m.order));
    const currentOrders = new Set(currentMedia.map((m) => m.order));

    // Determine media to add
    const toAdd = currentMedia.filter((m) => !existingOrders.has(m.order));

    // Determine media to remove
    const toRemove = existingMedia.filter((m) => !currentOrders.has(m.order));

    // Add new media
    if (toAdd.length > 0) {
      await this.prisma.postMedia.createMany({
        data: toAdd.map((m) => ({
          postId,
          url: m.url,
          order: m.order,
          createdAt: m.createdAt,
        })),
        skipDuplicates: true,
      });
    }

    // Remove old media
    if (toRemove.length > 0) {
      await this.prisma.postMedia.deleteMany({
        where: {
          postId,
          order: {
            in: toRemove.map((m) => m.order),
          },
        },
      });
    }
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private fromPersistence(data: any): PostAggregate {
    return PostAggregate.fromPersistence({
      id: data.id,
      authorId: data.authorId,
      communityId: data.communityId,
      content: data.content,
      likeCount: data.likeCount,
      viewCount: data.viewCount,
      commentCount: data.commentCount,
      isDeleted: data.isDeleted,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      mediaItems: data.media || [],
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(post: PostAggregate): any {
    return {
      id: post.id.value,
      authorId: post.authorId.value,
      communityId: post.communityId?.value || null,
      content: post.content.value,
      likeCount: post.likeCount,
      viewCount: post.viewCount,
      commentCount: post.commentCount,
      isDeleted: post.isDeleted,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
