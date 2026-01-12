import { BaseResponse } from '@core/response/base-response';
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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
  ApiPaginationResponse,
} from '@core/decorator/doc.decorator';
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
@ApiTags('Comment')
@ApiExtraModelsCustom(CommentResponseDto)
@Controller('user/comment')
export class CommentController {
  constructor(private readonly commentService: CommentApplicationService) {}

  /**
   * Create new comment
   */
  @Post()
  @ApiOperation({ summary: 'Create new comment' })
  @ApiResponseCustom(CommentResponseDto)
  async createComment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<BaseResponse<CommentResponseDto>> {
    const comment = await this.commentService.createComment(userId, dto);
    return BaseResponse.of(comment);
  }

  /**
   * Get comment by ID
   */
  @Get(':commentId')
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiResponseCustom(CommentResponseDto)
  async getComment(
    @CurrentUser('id') userId: string | null,
    @Param('commentId') commentId: string,
  ): Promise<BaseResponse<CommentResponseDto>> {
    const comment = await this.commentService.getComment(userId, commentId);
    return BaseResponse.of(comment);
  }

  /**
   * Update comment
   */
  @Patch(':commentId')
  @ApiOperation({ summary: 'Update comment' })
  @ApiResponseCustom(CommentResponseDto)
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
   */
  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete comment' })
  @ApiResponseCustom()
  async deleteComment(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ): Promise<BaseResponse<void>> {
    await this.commentService.deleteComment(userId, commentId);
    return BaseResponse.ok();
  }

  /**
   * Get comments by post
   */
  @Get('post/:postId')
  @ApiOperation({ summary: 'Get comments by post' })
  @ApiPaginationResponse(CommentResponseDto)
  async getCommentsByPost(
    @Param('postId') postId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginationResponse<CommentResponseDto>> {
    return await this.commentService.getCommentsByPost(
      postId,
      pagination.page,
      pagination.limit,
    );
  }

  /**
   * Get replies to a comment
   */
  @Get(':commentId/replies')
  @ApiOperation({ summary: 'Get replies to a comment' })
  @ApiPaginationResponse(CommentResponseDto)
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginationResponse<CommentResponseDto>> {
    return await this.commentService.getReplies(
      commentId,
      pagination.page,
      pagination.limit,
    );
  }

  /**
   * Get comments by author
   */
  @Get('author/:authorId')
  @ApiOperation({ summary: 'Get comments by author' })
  @ApiPaginationResponse(CommentResponseDto)
  async getCommentsByAuthor(
    @Param('authorId') authorId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginationResponse<CommentResponseDto>> {
    return await this.commentService.getCommentsByAuthor(
      authorId,
      pagination.page,
      pagination.limit,
    );
  }
}
