import { ApiExtraModelsCustom, ApiPaginationResponse, ApiResponseCustom } from "@core/decorator/doc.decorator";
import { Roles } from "@core/decorator/role.decorator";
import { Body, Controller, Post, Get, Patch, Delete, Req, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiTags, ApiParam } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import { commentResponses } from "./response/index.response";
import { CommentService } from "./comment.service";
import { CreateCommentResponse } from "./response/create-comment.response";
import { GetCommentResponse, CommentDto } from "./response/get-comment.response";
import { GetCommentsResponse } from "./response/get-comments.response";
import { UpdateCommentResponse } from "./response/update-comment.response";
import { DeleteCommentResponse } from "./response/delete-comment.response";
import { CreateCommentRequest } from "./request/create-comment.request";
import { UpdateCommentRequest } from "./request/update-comment.request";
import { GetCommentsRequest } from "./request/get-comments.request";
import { Role } from "src/db/prisma/enums";
import { IRequest } from "@shared/interface/request.interface";

@ApiBearerAuth()
@Roles(Role.FAN, Role.IDOL, Role.ADMIN)
@ApiTags('Comment')
@ApiExtraModelsCustom(...commentResponses)
@Controller({ path: 'comment', version: ApiVersion.V1 })
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiResponseCustom(CreateCommentResponse)
  @ApiBody({ type: CreateCommentRequest })
  createComment(
    @Body() body: CreateCommentRequest,
    @Req() request: IRequest
  ) {
    return this.commentService.createComment(body, request);
  }

  @Get('post/:postId')
  @ApiPaginationResponse(CommentDto)
  @ApiParam({ name: 'postId', description: 'Post ID' })
  getComments(
    @Param('postId') postId: string,
    @Query() query: GetCommentsRequest,
    @Req() request: IRequest
  ) {
    return this.commentService.getComments(postId, query, request);
  }

  @Get(':commentId')
  @ApiResponseCustom(GetCommentResponse)
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  getComment(
    @Param('commentId') commentId: string,
    @Req() request: IRequest
  ) {
    return this.commentService.getComment(commentId, request);
  }

  @Patch(':commentId')
  @ApiResponseCustom(UpdateCommentResponse)
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiBody({ type: UpdateCommentRequest })
  updateComment(
    @Param('commentId') commentId: string,
    @Body() body: UpdateCommentRequest,
    @Req() request: IRequest
  ) {
    return this.commentService.updateComment(commentId, body, request);
  }

  @Delete(':commentId')
  @ApiResponseCustom(DeleteCommentResponse)
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  deleteComment(
    @Param('commentId') commentId: string,
    @Req() request: IRequest
  ) {
    return this.commentService.deleteComment(commentId, request);
  }
}
