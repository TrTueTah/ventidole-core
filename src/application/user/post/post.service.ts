import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PageInfo, PaginationResponse } from '@application/shared/dto/pagination.dto';
import { PostRepository } from '@domain/content/post/post.repository';
import { PostAggregate } from '@domain/content/post/post.aggregate';
import { PostDomainService } from '@domain/content/post/post.domain-service';
import { PostId } from '@domain/shared/value-objects/post-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { CanViewPostPolicy } from '@domain/content/post/policies/can-view-post.policy';
import { CanEditPostPolicy } from '@domain/content/post/policies/can-edit-post.policy';
import { CanModeratePostPolicy } from '@domain/content/post/policies/can-moderate-post.policy';
import {
  CreatePostDto,
  UpdatePostDto,
  PostResponseDto,
  PostMediaResponseDto,
} from './dto';

/**
 * Post Application Service
 *
 * Orchestrates post use cases.
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
export class PostApplicationService {
  constructor(
    @Inject('PostRepository')
    private readonly postRepository: PostRepository,
    private readonly postDomainService: PostDomainService,
    private readonly canViewPost: CanViewPostPolicy,
    private readonly canEditPost: CanEditPostPolicy,
    private readonly canModeratePost: CanModeratePostPolicy,
  ) {}

  /**
   * Create new post
   */
  async createPost(
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    // If community is specified, check if user can post in it
    if (dto.communityId) {
      const canPost = await this.postDomainService.canUserPostInCommunity(
        UserId.fromString(authorId),
        CommunityId.fromString(dto.communityId),
      );

      if (!canPost) {
        throw new Error('User cannot post in this community');
      }
    }

    // Create aggregate
    const post = PostAggregate.create({
      authorId,
      communityId: dto.communityId,
      content: dto.content,
      mediaUrls: dto.mediaUrls,
    });

    // Persist
    await this.postRepository.save(post);

    // Return DTO
    return this.mapToDto(post);
  }

  /**
   * Get post by ID
   */
  async getPost(
    userId: string | null,
    postId: string,
  ): Promise<PostResponseDto> {
    // Check policy
    await this.canViewPost.check(userId, postId);

    // Load aggregate
    const post = await this.postRepository.findById(PostId.fromString(postId));

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count
    post.incrementViewCount();
    await this.postRepository.save(post);

    // Return DTO
    return this.mapToDto(post);
  }

  /**
   * Update post
   */
  async updatePost(
    userId: string,
    postId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    // Check policy
    await this.canEditPost.check(userId, postId);

    // Load aggregate
    const post = await this.postRepository.findById(PostId.fromString(postId));

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Execute business logic
    post.updateContent({
      content: dto.content,
      mediaUrls: dto.mediaUrls,
    });

    // Persist
    await this.postRepository.save(post);

    // Return DTO
    return this.mapToDto(post);
  }

  /**
   * Like post
   */
  async likePost(userId: string, postId: string): Promise<void> {
    // Load aggregate
    const post = await this.postRepository.findById(PostId.fromString(postId));

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Execute business logic
    post.like(userId);

    // Persist
    await this.postRepository.save(post);
  }

  /**
   * Unlike post
   */
  async unlikePost(userId: string, postId: string): Promise<void> {
    // Load aggregate
    const post = await this.postRepository.findById(PostId.fromString(postId));

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Execute business logic
    post.unlike(userId);

    // Persist
    await this.postRepository.save(post);
  }

  /**
   * Delete post
   */
  async deletePost(userId: string, postId: string): Promise<void> {
    // Check policy
    await this.canModeratePost.check(userId, postId);

    // Load aggregate
    const post = await this.postRepository.findById(PostId.fromString(postId));

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Execute business logic
    post.delete();

    // Persist
    await this.postRepository.save(post);
  }

  /**
   * Get posts by author
   */
  async getPostsByAuthor(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResponse<PostResponseDto>> {
    const result = await this.postRepository.findByAuthor(
      UserId.fromString(authorId),
      { page, limit },
    );

    const data = result.posts.map((p) => this.mapToDto(p));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Get posts by community
   */
  async getPostsByCommunity(
    communityId: string,
    page: number,
    limit: number,
  ): Promise<PaginationResponse<PostResponseDto>> {
    const result = await this.postRepository.findByCommunity(
      CommunityId.fromString(communityId),
      { page, limit },
    );

    const data = result.posts.map((p) => this.mapToDto(p));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Get feed posts
   */
  async getFeedPosts(
    userId: string | null,
    page: number,
    limit: number,
  ): Promise<PaginationResponse<PostResponseDto>> {
    const result = await this.postRepository.findForFeed({
      page,
      limit,
      userId: userId || undefined,
    });

    const data = result.posts.map((p) => this.mapToDto(p));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Map aggregate to DTO
   */
  private mapToDto(post: PostAggregate): PostResponseDto {
    const media: PostMediaResponseDto[] = post
      .getMediaItems()
      .map((m) => ({
        url: m.url,
        order: m.order,
      }));

    return {
      id: post.id.value,
      authorId: post.authorId.value,
      communityId: post.communityId?.value || null,
      content: post.content.value,
      media,
      likeCount: post.likeCount,
      viewCount: post.viewCount,
      commentCount: post.commentCount,
      isDeleted: post.isDeleted,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
