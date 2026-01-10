import { BaseResponse } from '@application/shared/dto/base-response.dto';
import {
  PaginationDto,
  PaginationResponse,
} from '@application/shared/dto/pagination.dto';
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
import { CommentApplicationService } from './comment.service';
import {
  CommentResponseDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto';

/**
 * Comment Controller
 *
 * HTTP layer for comment operations.
 *
 * Responsibilities:
 * - Validate HTTP requests
 * - Extract user ID from token/session
 * - Call application service
 * - Return standardized responses
 *
 * Note: This controller is THIN - all business logic is in the domain/application layers.
 */
@Controller('user/comment')
export class CommentController {
  constructor(private readonly commentService: CommentApplicationService) {}

  /**
   * Create new comment
   *
   * POST /user/comment
   */
  @Post()
  async createComment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<BaseResponse<CommentResponseDto>> {
    const comment = await this.commentService.createComment(userId, dto);
    return BaseResponse.of(comment);
  }

  /**
   * Get comment by ID
   *
   * GET /user/comment/:commentId
   */
  @Get(':commentId')
  async getComment(
    @CurrentUser('id') userId: string | null,
    @Param('commentId') commentId: string,
  ): Promise<BaseResponse<CommentResponseDto>> {
    const comment = await this.commentService.getComment(userId, commentId);
    return BaseResponse.of(comment);
  }

  /**
   * Update comment
   *
   * PATCH /user/comment/:commentId
   */
  @Patch(':commentId')
  async updateComment(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<BaseResponse<CommentResponseDto>> {
    const comment = await this.commentService.updateComment(
      userId,
      commentId,
      dto,
    );
    return BaseResponse.of(comment);
  }

  /**
   * Delete comment
   *
   * DELETE /user/comment/:commentId
   */
  @Delete(':commentId')
  async deleteComment(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ): Promise<BaseResponse<void>> {
    await this.commentService.deleteComment(userId, commentId);
    return BaseResponse.ok();
  }

  /**
   * Get comments by post
   *
   * GET /user/comment/post/:postId
   */
  @Get('post/:postId')
  async getCommentsByPost(
    @Param('postId') postId: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<CommentResponseDto>>> {
    const comments = await this.commentService.getCommentsByPost(
      postId,
      pagination.page,
      pagination.limit,
    );
    return BaseResponse.of(comments);
  }

  /**
   * Get replies to a comment
   *
   * GET /user/comment/:commentId/replies
   */
  @Get(':commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<CommentResponseDto>>> {
    const replies = await this.commentService.getReplies(
      commentId,
      pagination.page,
      pagination.limit,
    );
    return BaseResponse.of(replies);
  }

  /**
   * Get comments by author
   *
   * GET /user/comment/author/:authorId
   */
  @Get('author/:authorId')
  async getCommentsByAuthor(
    @Param('authorId') authorId: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<CommentResponseDto>>> {
    const comments = await this.commentService.getCommentsByAuthor(
      authorId,
      pagination.page,
      pagination.limit,
    );
    return BaseResponse.of(comments);
  }
}
