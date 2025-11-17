import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AdminIdolsService } from './admin-idols.service';
import { Roles } from '@core/decorator/role.decorator';
import { Role } from 'src/db/prisma/enums';
import { CreateIdolRequest, GetIdolsRequest } from './request/index.request';
import { CreateIdolResponse, IdolDto } from './response/index.response';
import { BaseResponse } from '@shared/helper/response';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { ApiPaginationResponse } from '@core/decorator/doc.decorator';

@ApiTags('Admin Idols')
@Controller({ path: 'admin/idols', version: ApiVersion.V1 })
export class AdminIdolsController {
  constructor(private readonly adminIdolsService: AdminIdolsService) {}

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new idol account (Admin only)' })
  @ApiBody({ type: CreateIdolRequest })
  @ApiResponse({ status: 201, type: CreateIdolResponse })
  async createIdolAccount(
    @Body() body: CreateIdolRequest,
  ): Promise<BaseResponse<any>> {
    return this.adminIdolsService.createIdolAccount(body);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all idols with pagination (Admin only)' })
  @ApiPaginationResponse(IdolDto)
  async getAllIdols(@Query() query: GetIdolsRequest) {
    return this.adminIdolsService.getAllIdols(query);
  }
}