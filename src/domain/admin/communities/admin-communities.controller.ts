import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminCommunitiesService } from './admin-communities.service';
import { Roles } from '@core/decorator/role.decorator';
import { Role } from 'src/db/prisma/enums';
import { CreateCommunityRequest, GetCommunitiesRequest } from './request/index.request';
import { CreateCommunityResponse, CommunityDto } from './response/index.response';
import { BaseResponse } from '@shared/helper/response';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { ApiPaginationResponse } from '@core/decorator/doc.decorator';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@ApiTags('Admin Communities')
@Controller({ path: 'admin/communities', version: ApiVersion.V1 })
export class AdminCommunitiesController {
  constructor(private readonly adminCommunitiesService: AdminCommunitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new community (Admin only)' })
  @ApiBody({ type: CreateCommunityRequest })
  @ApiResponse({ status: 201, type: CreateCommunityResponse })
  async createCommunity(
    @Body() body: CreateCommunityRequest,
  ) {
    return this.adminCommunitiesService.createCommunity(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all communities with pagination (Admin only)' })
  @ApiPaginationResponse(CommunityDto)
  async getAllCommunities(@Query() query: GetCommunitiesRequest) {
    return this.adminCommunitiesService.getAllCommunities(query);
  }
}