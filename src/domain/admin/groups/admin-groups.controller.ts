import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminGroupsService } from './admin-groups.service';
import { Roles } from '@core/decorator/role.decorator';
import { Role } from 'src/db/prisma/enums';
import { CreateGroupRequest, GetGroupsRequest } from './request/index.request';
import { CreateGroupResponse, GroupDto } from './response/index.response';
import { BaseResponse } from '@shared/helper/response';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { ApiPaginationResponse } from '@core/decorator/doc.decorator';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@ApiTags('Admin Groups')
@Controller({ path: 'admin/groups', version: ApiVersion.V1 })
export class AdminGroupsController {
  constructor(private readonly adminGroupsService: AdminGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group (Admin only)' })
  @ApiBody({ type: CreateGroupRequest })
  @ApiResponse({ status: 201, type: CreateGroupResponse })
  async createGroup(
    @Body() body: CreateGroupRequest,
  ) {
    return this.adminGroupsService.createGroup(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups with pagination (Admin only)' })
  @ApiPaginationResponse(GroupDto)
  async getAllGroups(@Query() query: GetGroupsRequest) {
    return this.adminGroupsService.getAllGroups(query);
  }
}