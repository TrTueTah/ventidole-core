import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { CommentRepository } from '@domain/content/comment/comment.repository';
import { CommentAggregate } from '@domain/content/comment/comment.aggregate';
import { CommentId } from '@domain/shared/value-objects/comment-id.vo';
import { PostId } from '@domain/shared/value-objects/post-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Comment Repository Prisma Implementation
 *
 * Implements CommentRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve comments
 * - Publish domain events after persistence
 */
@Injectable()
export class CommentRepositoryPrisma implements CommentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(comment: CommentAggregate): Promise<void> {
    const data = this.toPersistence(comment);

    // Upsert comment
    await this.prisma.comment.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        postId: data.postId,
        authorId: data.authorId,
        parentCommentId: data.parentCommentId,
        content: data.content,
        replyCount: data.replyCount,
        isDeleted: data.isDeleted,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        content: data.content,
        replyCount: data.replyCount,
        isDeleted: data.isDeleted,
        updatedAt: data.updatedAt,
      },
    });

    // Publish domain events
    const events = comment.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    comment.clearDomainEvents();
  }

  async findById(id: CommentId): Promise<CommentAggregate | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: id.value },
    });

    if (!comment) {
      return null;
    }

    return this.fromPersistence(comment);
  }

  async findByPost(
    postId: PostId,
    params: { page: number; limit: number },
  ): Promise<{ comments: CommentAggregate[]; total: number }> {
    const where = {
      postId: postId.value,
      parentCommentId: null, // Only top-level comments
      isDeleted: false,
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((c) => this.fromPersistence(c)),
      total,
    };
  }

  async findReplies(
    parentCommentId: CommentId,
    params: { page: number; limit: number },
  ): Promise<{ comments: CommentAggregate[]; total: number }> {
    const where = {
      parentCommentId: parentCommentId.value,
      isDeleted: false,
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'asc', // Replies in chronological order
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((c) => this.fromPersistence(c)),
      total,
    };
  }

  async findByAuthor(
    authorId: UserId,
    params: { page: number; limit: number },
  ): Promise<{ comments: CommentAggregate[]; total: number }> {
    const where = {
      authorId: authorId.value,
      isDeleted: false,
    };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((c) => this.fromPersistence(c)),
      total,
    };
  }

  async delete(id: CommentId): Promise<void> {
    await this.prisma.comment.update({
      where: { id: id.value },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private fromPersistence(data: any): CommentAggregate {
    return CommentAggregate.fromPersistence({
      id: data.id,
      postId: data.postId,
      authorId: data.authorId,
      parentCommentId: data.parentCommentId,
      content: data.content,
      replyCount: data.replyCount,
      isDeleted: data.isDeleted,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(comment: CommentAggregate): any {
    return {
      id: comment.id.value,
      postId: comment.postId.value,
      authorId: comment.authorId.value,
      parentCommentId: comment.parentCommentId?.value || null,
      content: comment.content.value,
      replyCount: comment.replyCount,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
