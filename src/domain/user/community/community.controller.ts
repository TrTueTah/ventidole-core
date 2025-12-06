import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { CommunityService } from './community.service';
import { CommunityDetailDto } from './dto/community-detail.dto';
import { CommunityDto } from './dto/community.dto';

@ApiBearerAuth()
@ApiTags('User Communities')
@Controller({ path: 'user/community', version: ApiVersion.V1 })
@ApiExtraModelsCustom(CommunityDto)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  @ApiPaginationResponse(CommunityDto)
  async getAllCommunities(
    @Req() req: IRequest,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<CommunityDto>>> {
    const result = await this.communityService.getAllCommunities(
      req.user.id,
      pagination,
    );
    return BaseResponse.of(result);
  }

  @Get('joined')
  @ApiPaginationResponse(CommunityDto)
  async getJoinedCommunities(
    @Req() req: IRequest,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<CommunityDto>>> {
    const result = await this.communityService.getJoinedCommunities(
      req.user.id,
      pagination,
    );
    return BaseResponse.of(result);
  }

  @Post(':id/join')
  @ApiResponseCustom()
  async joinCommunity(
    @Req() req: IRequest,
    @Param('id') id: string,
  ): Promise<BaseResponse<null>> {
    await this.communityService.joinCommunity(req.user.id, id);
    return BaseResponse.ok();
  }

  @Delete(':id/leave')
  @ApiResponseCustom()
  async leaveCommunity(
    @Req() req: IRequest,
    @Param('id') id: string,
  ): Promise<BaseResponse<null>> {
    await this.communityService.leaveCommunity(req.user.id, id);
    return BaseResponse.ok();
  }

  @Get(':id')
  @ApiResponseCustom(CommunityDetailDto)
  async getDetailCommunity(
    @Req() req: IRequest,
    @Param('id') id: string,
  ): Promise<BaseResponse<CommunityDetailDto>> {
    const result = await this.communityService.getDetailCommunity(
      req.user.id,
      id,
    );
    return BaseResponse.of(result);
  }
}
