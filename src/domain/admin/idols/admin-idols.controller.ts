import { Controller, Post, Get, Body, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminIdolsService } from './admin-idols.service';
import { Roles } from '@core/decorator/role.decorator';
import { Role } from 'src/db/prisma/enums';
import { CreateIdolRequest, GetIdolsRequest, UpdateIdolRequest } from './request/index.request';
import { CreateIdolResponse, IdolDto, UpdateIdolResponse, GetIdolDetailResponse } from './response/index.response';
import { BaseResponse } from '@shared/helper/response';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { ApiPaginationResponse, ApiResponseCustom, ApiExtraModelsCustom, ApiBodyCustom } from '@core/decorator/doc.decorator';

@ApiTags('Admin Idols')
@Controller({ path: 'admin/idols', version: ApiVersion.V1 })
@ApiExtraModelsCustom(CreateIdolResponse, IdolDto, UpdateIdolResponse, GetIdolDetailResponse)
export class AdminIdolsController {
  constructor(private readonly adminIdolsService: AdminIdolsService) {}

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new idol account (Admin only)' })
  @ApiBodyCustom(CreateIdolRequest)
  @ApiResponseCustom(CreateIdolResponse)
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

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get(':idolId')
  @ApiOperation({ summary: 'Get idol detail by ID (Admin only)' })
  @ApiParam({ name: 'idolId', description: 'Idol ID' })
  @ApiResponseCustom(GetIdolDetailResponse)
  async getIdolDetail(@Param('idolId') idolId: string): Promise<BaseResponse<GetIdolDetailResponse>> {
    return this.adminIdolsService.getIdolDetail(idolId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':idolId')
  @ApiOperation({ summary: 'Update idol information (Admin only)' })
  @ApiParam({ name: 'idolId', description: 'Idol ID' })
  @ApiBodyCustom(UpdateIdolRequest)
  @ApiResponseCustom(UpdateIdolResponse)
  async updateIdol(
    @Param('idolId') idolId: string,
    @Body() body: UpdateIdolRequest,
  ): Promise<BaseResponse<UpdateIdolResponse>> {
    return this.adminIdolsService.updateIdol(idolId, body);
  }
}