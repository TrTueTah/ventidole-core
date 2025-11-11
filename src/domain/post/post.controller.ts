import { ApiExtraModelsCustom, ApiPaginationResponse, ApiResponseCustom } from "@core/decorator/doc.decorator";
import { Roles } from "@core/decorator/role.decorator";
import { Body, Controller, Post, Get, Patch, Delete, Req, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiTags, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import { postResponses } from "./response/index.response";
import { PostService } from "./post.service";
import { CreatePostResponse } from "./response/create-post.response";
import { GetPostResponse, PostDto } from "./response/get-post.response";
import { GetPostsResponse } from "./response/get-posts.response";
import { UpdatePostResponse } from "./response/update-post.response";
import { DeletePostResponse } from "./response/delete-post.response";
import { CreatePostRequest } from "./request/create-post.request";
import { UpdatePostRequest } from "./request/update-post.request";
import { GetPostsRequest } from "./request/get-posts.request";
import { Role } from "src/db/prisma/enums";
import { IRequest } from "@shared/interface/request.interface";

@ApiBearerAuth()
@Roles(Role.FAN, Role.IDOL, Role.ADMIN)
@ApiTags('Post')
// @ApiExtraModelsCustom(...postResponses)
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

  @Get()
  @ApiPaginationResponse(PostDto)
  getPosts(
    @Query() query: GetPostsRequest,
    @Req() request: IRequest
  ) {
    return this.postService.getPosts(query, request);
  }

  @Get(':postId')
  @ApiResponseCustom(GetPostResponse)
  @ApiParam({ name: 'postId', description: 'Post ID' })
  getPost(
    @Param('postId') postId: string,
    @Req() request: IRequest
  ) {
    return this.postService.getPost(postId, request);
  }

  @Patch(':postId')
  @ApiResponseCustom(UpdatePostResponse)
  @ApiParam({ name: 'postId', description: 'Post ID' })
  @ApiBody({ type: UpdatePostRequest })
  updatePost(
    @Param('postId') postId: string,
    @Body() body: UpdatePostRequest,
    @Req() request: IRequest
  ) {
    return this.postService.updatePost(postId, body, request);
  }

  @Delete(':postId')
  @ApiResponseCustom(DeletePostResponse)
  @ApiParam({ name: 'postId', description: 'Post ID' })
  deletePost(
    @Param('postId') postId: string,
    @Req() request: IRequest
  ) {
    return this.postService.deletePost(postId, request);
  }
}