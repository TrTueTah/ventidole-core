import { ApiExtraModelsCustom, ApiPaginationResponse, ApiResponseCustom } from "@core/decorator/doc.decorator";
import { Roles } from "@core/decorator/role.decorator";
import { Body, Controller, Post, Get, Patch, Delete, Req, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiTags, ApiParam } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import { replyResponses } from "./response/index.response";
import { ReplyService } from "./reply.service";
import { CreateReplyResponse } from "./response/create-reply.response";
import { GetReplyResponse, ReplyDto } from "./response/get-reply.response";
import { UpdateReplyResponse } from "./response/update-reply.response";
import { DeleteReplyResponse } from "./response/delete-reply.response";
import { CreateReplyRequest } from "./request/create-reply.request";
import { UpdateReplyRequest } from "./request/update-reply.request";
import { GetRepliesRequest } from "./request/get-replies.request";
import { Role } from "src/db/prisma/enums";
import { IRequest } from "@shared/interface/request.interface";

@ApiBearerAuth()
@Roles(Role.FAN, Role.IDOL, Role.ADMIN)
@ApiTags('Reply')
@ApiExtraModelsCustom(...replyResponses)
@Controller({ path: 'reply', version: ApiVersion.V1 })
export class ReplyController {
  constructor(private readonly replyService: ReplyService) {}

  @Post()
  @ApiResponseCustom(CreateReplyResponse)
  @ApiBody({ type: CreateReplyRequest })
  createReply(
    @Body() body: CreateReplyRequest,
    @Req() request: IRequest
  ) {
    return this.replyService.createReply(body, request);
  }

  @Get('comment/:commentId')
  @ApiPaginationResponse(ReplyDto)
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  getReplies(
    @Param('commentId') commentId: string,
    @Query() query: GetRepliesRequest,
    @Req() request: IRequest
  ) {
    return this.replyService.getReplies(commentId, query, request);
  }

  @Get(':replyId')
  @ApiResponseCustom(GetReplyResponse)
  @ApiParam({ name: 'replyId', description: 'Reply ID' })
  getReply(
    @Param('replyId') replyId: string,
    @Req() request: IRequest
  ) {
    return this.replyService.getReply(replyId, request);
  }

  @Patch(':replyId')
  @ApiResponseCustom(UpdateReplyResponse)
  @ApiParam({ name: 'replyId', description: 'Reply ID' })
  @ApiBody({ type: UpdateReplyRequest })
  updateReply(
    @Param('replyId') replyId: string,
    @Body() body: UpdateReplyRequest,
    @Req() request: IRequest
  ) {
    return this.replyService.updateReply(replyId, body, request);
  }

  @Delete(':replyId')
  @ApiResponseCustom(DeleteReplyResponse)
  @ApiParam({ name: 'replyId', description: 'Reply ID' })
  deleteReply(
    @Param('replyId') replyId: string,
    @Req() request: IRequest
  ) {
    return this.replyService.deleteReply(replyId, request);
  }
}
