import { ApiExtraModelsCustom, ApiPaginationResponse, ApiResponseCustom } from '@core/decorator/doc.decorator';
import { Roles } from '@core/decorator/role.decorator';
import { Body, Controller, Delete, Get, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { Role } from 'src/db/prisma/enums';
import { communityResponses } from './response';
import { CommunityService } from './community.service';
import { GetCommunitiesResponse } from './response/get-communities.response';
import { IRequest } from '@shared/interface/request.interface';
import { GetCommunitiesRequest } from './request/get-communities.request';
import { JoinCommunityRequest } from './request/join-community.request';
import { LeaveCommunityRequest } from './request/leave-community.request';

@ApiBearerAuth()
@Roles(Role.FAN, Role.IDOL, Role.ADMIN)
@ApiTags('Community')
@ApiExtraModelsCustom(...communityResponses)
@Controller({ path: 'community', version: ApiVersion.V1 })
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  @ApiOperation({
    summary: 'Get communities',
    description: 'Get communities with optional filtering. Use filter=joined to get only joined communities, or filter=all to get all communities with isJoin field.',
  })
  @ApiPaginationResponse(GetCommunitiesResponse)
  getCommunities(@Query() query: GetCommunitiesRequest, @Req() request: IRequest) {
    return this.communityService.getCommunities(query, request);
  }

  @Post('join')
  @ApiOperation({
    summary: 'Join a community',
    description: 'Join a community by providing the community ID',
  })
  @ApiResponseCustom()
  joinCommunity(@Body() body: JoinCommunityRequest, @Req() request: IRequest) {
    return this.communityService.joinCommunity(body, request);
  }

  @Delete('leave')
  @ApiOperation({
    summary: 'Leave a community',
    description: 'Leave a community by providing the community ID',
  })
  @ApiResponseCustom()
  leaveCommunity(@Body() body: LeaveCommunityRequest, @Req() request: IRequest) {
    return this.communityService.leaveCommunity(body, request);
  }
}
