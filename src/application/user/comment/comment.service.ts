import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@application/shared/dto/pagination.dto';
import { CommentRepository } from '@domain/content/comment/comment.repository';
import { CommentAggregate } from '@domain/content/comment/comment.aggregate';
import { PostRepository } from '@domain/content/post/post.repository';
import { CommentId } from '@domain/shared/value-objects/comment-id.vo';
import { PostId } from '@domain/shared/value-objects/post-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CanViewCommentPolicy } from '@domain/content/comment/policies/can-view-comment.policy';
import { CanEditCommentPolicy } from '@domain/content/comment/policies/can-edit-comment.policy';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
} from './dto';

/**
 * Comment Application Service
 *
 * Orchestrates comment use cases.
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
export class CommentApplicationService {
  constructor(
    @Inject('CommentRepository')
    private readonly commentRepository: CommentRepository,
    @Inject('PostRepository')
    private readonly postRepository: PostRepository,
    private readonly canViewComment: CanViewCommentPolicy,
    private readonly canEditComment: CanEditCommentPolicy,
  ) {}

  /**
   * Create new comment
   */
  async createComment(
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    // Verify post exists
    const post = await this.postRepository.findById(
      PostId.fromString(dto.postId),
    );

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.isDeleted) {
      throw new Error('Cannot comment on deleted post');
    }

    // If replying to a comment, verify parent exists
    if (dto.parentCommentId) {
      const parentComment = await this.commentRepository.findById(
        CommentId.fromString(dto.parentCommentId),
      );

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.isDeleted) {
        throw new Error('Cannot reply to deleted comment');
      }

      // Increment parent's reply count
      parentComment.incrementReplyCount();
      await this.commentRepository.save(parentComment);
    }

    // Create aggregate
    const comment = CommentAggregate.create({
      postId: dto.postId,
      authorId,
      content: dto.content,
      parentCommentId: dto.parentCommentId,
    });

    // Persist
    await this.commentRepository.save(comment);

    // Increment post's comment count
    post.incrementCommentCount();
    await this.postRepository.save(post);

    // Return DTO
    return this.mapToDto(comment);
  }

  /**
   * Get comment by ID
   */
  async getComment(
    userId: string | null,
    commentId: string,
  ): Promise<CommentResponseDto> {
    // Check policy
    await this.canViewComment.check(userId, commentId);

    // Load aggregate
    const comment = await this.commentRepository.findById(
      CommentId.fromString(commentId),
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Return DTO
    return this.mapToDto(comment);
  }

  /**
   * Update comment
   */
  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    // Check policy
    await this.canEditComment.check(userId, commentId);

    // Load aggregate
    const comment = await this.commentRepository.findById(
      CommentId.fromString(commentId),
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Execute business logic
    comment.updateContent(dto.content);

    // Persist
    await this.commentRepository.save(comment);

    // Return DTO
    return this.mapToDto(comment);
  }

  /**
   * Delete comment
   */
  async deleteComment(userId: string, commentId: string): Promise<void> {
    // Check policy (only author can delete)
    await this.canEditComment.check(userId, commentId);

    // Load aggregate
    const comment = await this.commentRepository.findById(
      CommentId.fromString(commentId),
    );

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Execute business logic
    comment.delete();

    // Persist
    await this.commentRepository.save(comment);

    // Decrement post's comment count
    const post = await this.postRepository.findById(comment.postId);
    if (post) {
      post.decrementCommentCount();
      await this.postRepository.save(post);
    }

    // If this is a reply, decrement parent's reply count
    if (comment.parentCommentId) {
      const parentComment = await this.commentRepository.findById(
        comment.parentCommentId,
      );
      if (parentComment) {
        parentComment.decrementReplyCount();
        await this.commentRepository.save(parentComment);
      }
    }
  }

  /**
   * Get comments by post
   */
  async getCommentsByPost(
    postId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResponse<CommentResponseDto>> {
    const result = await this.commentRepository.findByPost(
      PostId.fromString(postId),
      { page, limit },
    );

    const data = result.comments.map((c) => this.mapToDto(c));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Get replies to a comment
   */
  async getReplies(
    commentId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResponse<CommentResponseDto>> {
    const result = await this.commentRepository.findReplies(
      CommentId.fromString(commentId),
      { page, limit },
    );

    const data = result.comments.map((c) => this.mapToDto(c));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Get comments by author
   */
  async getCommentsByAuthor(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResponse<CommentResponseDto>> {
    const result = await this.commentRepository.findByAuthor(
      UserId.fromString(authorId),
      { page, limit },
    );

    const data = result.comments.map((c) => this.mapToDto(c));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Map aggregate to DTO
   */
  private mapToDto(comment: CommentAggregate): CommentResponseDto {
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
