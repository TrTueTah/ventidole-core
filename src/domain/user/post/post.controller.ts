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
import { PostDto } from './dto/post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostService } from './post.service';

@ApiBearerAuth()
@ApiTags('User Posts')
@Controller({ path: 'user/posts', version: ApiVersion.V1 })
@ApiExtraModelsCustom(PostDto, CreatePostDto, UpdatePostDto)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @ApiPaginationResponse(PostDto)
  async getPosts(
    @Query() pagination: GetPostsDto,
  ): Promise<BaseResponse<PaginationResponse<PostDto>>> {
    const result = await this.postService.getPosts(pagination);
    return BaseResponse.of(result);
  }

  @Get(':id')
  @ApiResponseCustom(PostDto)
  async getPostById(@Param('id') id: string): Promise<BaseResponse<PostDto>> {
    const result = await this.postService.getPostById(id);
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
}
