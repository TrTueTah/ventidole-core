import {
  PaginationDto,
  PaginationResponse,
} from '@application/shared/dto/pagination.dto';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { BaseResponse } from '@core/response/base-response';
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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreatePostDto,
  PostMediaResponseDto,
  PostResponseDto,
  UpdatePostDto,
} from './dto';
import { PostApplicationService } from './post.service';

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
@ApiTags('Post')
@ApiExtraModelsCustom(PostResponseDto, PostMediaResponseDto)
@Controller('user/post')
export class PostController {
  constructor(private readonly postService: PostApplicationService) {}

  /**
   * Create new post
   */
  @Post()
  @ApiOperation({ summary: 'Create new post' })
  @ApiResponseCustom(PostResponseDto)
  async createPost(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
  ): Promise<BaseResponse<PostResponseDto>> {
    const post = await this.postService.createPost(userId, dto);
    return BaseResponse.of(post);
  }

  /**
   * Get post by ID
   */
  @Get(':postId')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponseCustom(PostResponseDto)
  async getPost(
    @CurrentUser('id') userId: string | null,
    @Param('postId') postId: string,
  ): Promise<BaseResponse<PostResponseDto>> {
    const post = await this.postService.getPost(userId, postId);
    return BaseResponse.of(post);
  }

  /**
   * Update post
   */
  @Patch(':postId')
  @ApiOperation({ summary: 'Update post' })
  @ApiResponseCustom(PostResponseDto)
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
   */
  @Post(':postId/like')
  @ApiOperation({ summary: 'Like post' })
  @ApiResponseCustom()
  async likePost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<BaseResponse<void>> {
    await this.postService.likePost(userId, postId);
    return BaseResponse.ok();
  }

  /**
   * Unlike post
   */
  @Delete(':postId/like')
  @ApiOperation({ summary: 'Unlike post' })
  @ApiResponseCustom()
  async unlikePost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<BaseResponse<void>> {
    await this.postService.unlikePost(userId, postId);
    return BaseResponse.ok();
  }

  /**
   * Delete post
   */
  @Delete(':postId')
  @ApiOperation({ summary: 'Delete post' })
  @ApiResponseCustom()
  async deletePost(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<BaseResponse<void>> {
    await this.postService.deletePost(userId, postId);
    return BaseResponse.ok();
  }

  /**
   * Get posts by author
   */
  @Get('author/:authorId')
  @ApiOperation({ summary: 'Get posts by author' })
  @ApiPaginationResponse(PostResponseDto)
  async getPostsByAuthor(
    @Param('authorId') authorId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginationResponse<PostResponseDto>> {
    return await this.postService.getPostsByAuthor(
      authorId,
      pagination.page,
      pagination.limit,
    );
  }

  /**
   * Get posts by community
   */
  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get posts by community' })
  @ApiPaginationResponse(PostResponseDto)
  async getPostsByCommunity(
    @Param('communityId') communityId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginationResponse<PostResponseDto>> {
    return await this.postService.getPostsByCommunity(
      communityId,
      pagination.page,
      pagination.limit,
    );
  }

  /**
   * Get feed posts
   */
  @Get('feed')
  @ApiOperation({ summary: 'Get feed posts' })
  @ApiPaginationResponse(PostResponseDto)
  async getFeedPosts(
    @CurrentUser('id') userId: string | null,
    @Query() pagination: PaginationDto,
  ): Promise<PaginationResponse<PostResponseDto>> {
    return await this.postService.getFeedPosts(
      userId,
      pagination.page,
      pagination.limit,
    );
  }
}
