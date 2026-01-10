import { BaseResponse } from '@application/shared/dto/base-response.dto';
import { PaginationDto, PaginationResponse } from '@application/shared/dto/pagination.dto';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PostApplicationService } from './post.service';
import { CreatePostDto, PostResponseDto, UpdatePostDto } from './dto';

/**
 * Post Controller
 *
 * HTTP layer for post operations.
 *
 * Responsibilities:
 * - Validate HTTP requests
 * - Extract user ID from token/session
 * - Call application service
 * - Return standardized responses
 *
 * Note: This controller is THIN - all business logic is in the domain/application layers.
 */
@Controller('user/post')
export class PostController {
  constructor(private readonly postService: PostApplicationService) {}

  /**
   * Create new post
   *
   * POST /user/post
   */
  @Post()
  async createPost(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
  ): Promise<BaseResponse<PostResponseDto>> {
    const post = await this.postService.createPost(userId, dto);
    return BaseResponse.of(post);
  }

  /**
   * Get post by ID
   *
   * GET /user/post/:postId
   */
  @Get(':postId')
  async getPost(
    @CurrentUser('id') userId: string | null,
    @Param('postId') postId: string,
  ): Promise<BaseResponse<PostResponseDto>> {
    const post = await this.postService.getPost(userId, postId);
    return BaseResponse.of(post);
  }

  /**
   * Update post
   *
   * PATCH /user/post/:postId
   */
  @Patch(':postId')
  async updatePost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ): Promise<BaseResponse<PostResponseDto>> {
    const post = await this.postService.updatePost(userId, postId, dto);
    return BaseResponse.of(post);
  }

  /**
   * Like post
   *
   * POST /user/post/:postId/like
   */
  @Post(':postId/like')
  async likePost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<BaseResponse<void>> {
    await this.postService.likePost(userId, postId);
    return BaseResponse.ok();
  }

  /**
   * Unlike post
   *
   * DELETE /user/post/:postId/like
   */
  @Delete(':postId/like')
  async unlikePost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<BaseResponse<void>> {
    await this.postService.unlikePost(userId, postId);
    return BaseResponse.ok();
  }

  /**
   * Delete post
   *
   * DELETE /user/post/:postId
   */
  @Delete(':postId')
  async deletePost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<BaseResponse<void>> {
    await this.postService.deletePost(userId, postId);
    return BaseResponse.ok();
  }

  /**
   * Get posts by author
   *
   * GET /user/post/author/:authorId
   */
  @Get('author/:authorId')
  async getPostsByAuthor(
    @Param('authorId') authorId: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<PostResponseDto>>> {
    const posts = await this.postService.getPostsByAuthor(
      authorId,
      pagination.page,
      pagination.limit,
    );
    return BaseResponse.of(posts);
  }

  /**
   * Get posts by community
   *
   * GET /user/post/community/:communityId
   */
  @Get('community/:communityId')
  async getPostsByCommunity(
    @Param('communityId') communityId: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<PostResponseDto>>> {
    const posts = await this.postService.getPostsByCommunity(
      communityId,
      pagination.page,
      pagination.limit,
    );
    return BaseResponse.of(posts);
  }

  /**
   * Get feed posts
   *
   * GET /user/post/feed
   */
  @Get('feed')
  async getFeedPosts(
    @CurrentUser('id') userId: string | null,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<PostResponseDto>>> {
    const posts = await this.postService.getFeedPosts(
      userId,
      pagination.page,
      pagination.limit,
    );
    return BaseResponse.of(posts);
  }
}
