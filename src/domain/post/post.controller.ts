import { ApiExtraModelsCustom, ApiResponseCustom } from "@core/decorator/doc.decorator";
import { Roles } from "@core/decorator/role.decorator";
import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiTags } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import { postResponses } from "./response/index.response";
import { PostService } from "./post.service";
import { CreatePostResponse } from "./response/create-post.response";
import { CreatePostRequest } from "./request/create-post.request";
import { Role } from "src/db/prisma/enums";
import { IRequest } from "@shared/interface/request.interface";

@ApiBearerAuth()
@Roles(Role.FAN, Role.IDOL, Role.ADMIN)
@ApiTags('Post')
@ApiExtraModelsCustom(...postResponses)
@Controller({ path: 'post', version: ApiVersion.V1 })
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiResponseCustom(CreatePostResponse)
  @ApiBody({ type: CreatePostRequest })
  createPost(
    @Body() body: CreatePostRequest,
    @Req() request: IRequest
  ) {
    return this.postService.createPost(body, request);
  }
}