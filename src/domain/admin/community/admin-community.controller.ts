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
import { AdminCommunityService } from './admin-community.service';
import { AdminCommunityDetailDto } from './dto/community-detail.dto';
import { CommunityDto } from './dto/community.dto';
import { CreateCommunityDto } from './dto/create-community.dto';
import { GetCommunitiesDto } from './dto/get-communities.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@ApiBearerAuth()
@ApiTags('Admin Community Management')
@Controller({ path: 'admin/community', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  CommunityDto,
  AdminCommunityDetailDto,
  CreateCommunityDto,
  UpdateCommunityDto,
)
export class AdminCommunityController {
  constructor(private readonly adminCommunityService: AdminCommunityService) {}

  @Get()
  @ApiPaginationResponse(CommunityDto)
  async getAllCommunities(
    @Query() filters: GetCommunitiesDto,
  ): Promise<PaginationResponse<CommunityDto>> {
    const result = await this.adminCommunityService.getAllCommunities(filters);
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(AdminCommunityDetailDto)
  async getCommunityById(
    @Param('id') id: string,
  ): Promise<BaseResponse<AdminCommunityDetailDto>> {
    const result = await this.adminCommunityService.getCommunityById(id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(CommunityDto)
  async createCommunity(
    @Req() req: IRequest,
    @Body() createCommunityDto: CreateCommunityDto,
  ): Promise<BaseResponse<CommunityDto>> {
    const result = await this.adminCommunityService.createCommunity(
      createCommunityDto,
      req.user.id,
    );
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(CommunityDto)
  async updateCommunity(
    @Param('id') id: string,
    @Body() updateCommunityDto: UpdateCommunityDto,
  ): Promise<BaseResponse<CommunityDto>> {
    const result = await this.adminCommunityService.updateCommunity(
      id,
      updateCommunityDto,
    );
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deleteCommunity(@Param('id') id: string): Promise<BaseResponse<null>> {
    await this.adminCommunityService.deleteCommunity(id);
    return BaseResponse.ok();
  }
}
