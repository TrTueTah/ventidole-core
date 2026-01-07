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
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import { PostDto } from './dto/post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@ApiBearerAuth()
@ApiTags('User Posts')
@Controller({ path: 'user/posts', version: ApiVersion.V1 })
@ApiExtraModelsCustom(PostDto, CreatePostDto, UpdatePostDto, PostDetailDto)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @ApiPaginationResponse(PostDto)
  async getPosts(
    @Req() req: IRequest,
    @Query() pagination: GetPostsDto,
  ): Promise<PaginationResponse<PostDto>> {
    const result = await this.postService.getPosts(pagination, req.user?.id);
    return result;
  }

  @Get('recommendations')
  @ApiPaginationResponse(PostDto)
  async getRecommendations(
    @Req() req: IRequest,
    @Query() query: GetRecommendationsDto,
  ): Promise<PaginationResponse<PostDto>> {
    const result = await this.postService.getRecommendations(
      req.user.id,
      query.limit,
      query.offset,
    );
    return result;
  }

  @Get('user/:userId')
  @ApiPaginationResponse(PostDto)
  async getPostsByUserId(
    @Req() req: IRequest,
    @Param('userId') userId: string,
    @Query() pagination: GetPostsDto,
  ): Promise<PaginationResponse<PostDto>> {
    const result = await this.postService.getPostsByUserId(
      userId,
      pagination,
      req.user?.id,
    );
    return result;
  }

  @Get('reactions/:userId')
  @ApiPaginationResponse(PostDto)
  async getReactionPostsByUserId(
    @Req() req: IRequest,
    @Param('userId') userId: string,
    @Query() pagination: GetPostsDto,
  ): Promise<PaginationResponse<PostDto>> {
    const result = await this.postService.getReactionPostsByUserId(
      userId,
      pagination,
      req.user?.id,
    );
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(PostDetailDto)
  async getPostById(
    @Req() req: IRequest,
    @Param('id') id: string,
  ): Promise<BaseResponse<PostDetailDto>> {
    const result = await this.postService.getPostById(id, req.user?.id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(PostDto)
  async createPost(
    @Req() req: IRequest,
    @Body() createPostDto: CreatePostDto,
  ): Promise<BaseResponse<PostDto>> {
    const result = await this.postService.createPost(
      req.user.id,
      createPostDto,
    );
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(PostDto)
  async updatePost(
    @Req() req: IRequest,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<BaseResponse<PostDto>> {
    const result = await this.postService.updatePost(
      req.user.id,
      id,
      updatePostDto,
    );
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deletePost(
    @Req() req: IRequest,
    @Param('id') id: string,
  ): Promise<BaseResponse<null>> {
    await this.postService.deletePost(req.user.id, id);
    return BaseResponse.ok();
  }

  @Post(':id/like')
  @ApiResponseCustom()
  async likePost(
    @Req() req: IRequest,
    @Param('id') id: string,
  ): Promise<BaseResponse<{ liked: boolean }>> {
    const result = await this.postService.likePost(req.user.id, id);
    return BaseResponse.of(result);
  }

  @Post(':id/view')
  @ApiResponseCustom()
  async viewPost(
    @Req() req: IRequest,
    @Param('id') id: string,
  ): Promise<BaseResponse<null>> {
    await this.postService.viewPost(req.user.id, id);
    return BaseResponse.ok();
  }
}
