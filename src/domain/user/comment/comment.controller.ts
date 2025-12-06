import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { CommentService } from './comment.service';
import { CommentDto } from './dto/comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiBearerAuth()
@ApiTags('User Comments')
@Controller({ path: 'user/comment', version: ApiVersion.V1 })
@ApiExtraModelsCustom(CommentDto, CreateCommentDto, UpdateCommentDto)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':postId')
  @ApiPaginationResponse(CommentDto)
  async getCommentsByPostId(
    @Param('postId') postId: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<CommentDto>>> {
    const result = await this.commentService.getCommentsByPostId(
      postId,
      pagination,
    );
    return BaseResponse.of(result);
  }

  @Post(':postId')
  @ApiResponseCustom(CommentDto)
  async createComment(
    @Req() req: IRequest,
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<BaseResponse<CommentDto>> {
    const result = await this.commentService.createComment(
      req.user.id,
      postId,
      createCommentDto,
    );
    return BaseResponse.of(result);
  }

  @Patch(':postId/:id')
  @ApiResponseCustom(CommentDto)
  async updateComment(
    @Req() req: IRequest,
    @Param('postId') postId: string,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<BaseResponse<CommentDto>> {
    const result = await this.commentService.updateComment(
      req.user.id,
      postId,
      id,
      updateCommentDto,
    );
    return BaseResponse.of(result);
  }

  @Delete(':postId/:id')
  @ApiResponseCustom()
  async deleteComment(
    @Req() req: IRequest,
    @Param('postId') postId: string,
    @Param('id') id: string,
  ): Promise<BaseResponse<null>> {
    await this.commentService.deleteComment(req.user.id, postId, id);
    return BaseResponse.ok();
  }
}
