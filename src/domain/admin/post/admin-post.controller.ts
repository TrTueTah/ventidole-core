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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { AdminPostService } from './admin-post.service';
import { AdminCreatePostDto } from './dto/admin-create-post.dto';
import { AdminPostDetailDto } from './dto/admin-post-detail.dto';
import { AdminPostDto } from './dto/admin-post.dto';
import { AdminUpdatePostDto } from './dto/admin-update-post.dto';
import { GetAdminPostsDto } from './dto/get-admin-posts.dto';
import { ReportedPostDto } from './dto/reported-post.dto';

@ApiBearerAuth()
@ApiTags('Admin Post Management')
@Controller({ path: 'admin/post', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  AdminPostDto,
  AdminPostDetailDto,
  AdminCreatePostDto,
  AdminUpdatePostDto,
  ReportedPostDto,
)
export class AdminPostController {
  constructor(private readonly adminPostService: AdminPostService) {}

  @Get()
  @ApiPaginationResponse(AdminPostDto)
  async getAllPosts(
    @Query() filters: GetAdminPostsDto,
  ): Promise<PaginationResponse<AdminPostDto>> {
    const result = await this.adminPostService.getAllPosts(filters);
    return result;
  }

  @Get('reported')
  @ApiPaginationResponse(ReportedPostDto)
  async getReportedPosts(
    @Query() filters: GetAdminPostsDto,
  ): Promise<PaginationResponse<ReportedPostDto>> {
    const result = await this.adminPostService.getReportedPosts(filters);
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(AdminPostDetailDto)
  async getPostById(
    @Param('id') id: string,
  ): Promise<BaseResponse<AdminPostDetailDto>> {
    const result = await this.adminPostService.getPostById(id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(AdminPostDto)
  async createPost(
    @Body() createPostDto: AdminCreatePostDto,
  ): Promise<BaseResponse<AdminPostDto>> {
    const result = await this.adminPostService.createPost(createPostDto);
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(AdminPostDto)
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: AdminUpdatePostDto,
  ): Promise<BaseResponse<AdminPostDto>> {
    const result = await this.adminPostService.updatePost(id, updatePostDto);
    return BaseResponse.of(result);
  }

  @Patch(':id/ban')
  @ApiResponseCustom(AdminPostDto)
  async banPost(@Param('id') id: string): Promise<BaseResponse<AdminPostDto>> {
    const result = await this.adminPostService.banPost(id);
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deletePost(@Param('id') id: string): Promise<BaseResponse<void>> {
    await this.adminPostService.deletePost(id);
    return BaseResponse.of(null);
  }
}
