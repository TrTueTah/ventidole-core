import { BaseResponse } from '@core/response/base-response';
import {
  PaginationDto,
  PaginationResponse,
} from '@application/shared/dto/pagination.dto';
import { CurrentUser } from '@core/decorator/current-user.decorator';
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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
  ApiPaginationResponse,
} from '@core/decorator/doc.decorator';
import { CommunityApplicationService } from './community.service';
import {
  CommunityResponseDto,
  CreateCommunityDto,
  UpdateCommunityDto,
} from './dto';

/**
 * Community Controller
 *
 * HTTP layer for community operations.
 *
 * Responsibilities:
 * - Validate HTTP requests
 * - Extract user ID from token/session
 * - Call application service
 * - Return standardized responses
 *
 * Note: This controller is THIN - all business logic is in the domain/application layers.
 */
@ApiTags('Community')
@ApiExtraModelsCustom(CommunityResponseDto)
@Controller('user/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityApplicationService) {}

  /**
   * Create new community
   */
  @Post()
  @ApiOperation({ summary: 'Create new community' })
  @ApiResponseCustom(CommunityResponseDto)
  async createCommunity(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommunityDto,
  ): Promise<BaseResponse<CommunityResponseDto>> {
    const community = await this.communityService.createCommunity(userId, dto);
    return BaseResponse.of(community);
  }

  /**
   * Get community by ID
   */
  @Get(':communityId')
  @ApiOperation({ summary: 'Get community by ID' })
  @ApiResponseCustom(CommunityResponseDto)
  async getCommunity(
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<CommunityResponseDto>> {
    const community = await this.communityService.getCommunity(communityId);
    return BaseResponse.of(community);
  }

  /**
   * Update community profile
   */
  @Patch(':communityId')
  @ApiOperation({ summary: 'Update community profile' })
  @ApiResponseCustom(CommunityResponseDto)
  async updateCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
    @Body() dto: UpdateCommunityDto,
  ): Promise<BaseResponse<CommunityResponseDto>> {
    const community = await this.communityService.updateCommunity(
      userId,
      communityId,
      dto,
    );
    return BaseResponse.of(community);
  }

  /**
   * Follow community
   */
  @Post(':communityId/follow')
  @ApiOperation({ summary: 'Follow community' })
  @ApiResponseCustom()
  async followCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<void>> {
    await this.communityService.followCommunity(userId, communityId);
    return BaseResponse.ok();
  }

  /**
   * Unfollow community
   */
  @Delete(':communityId/follow')
  @ApiOperation({ summary: 'Unfollow community' })
  @ApiResponseCustom()
  async unfollowCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<void>> {
    await this.communityService.unfollowCommunity(userId, communityId);
    return BaseResponse.ok();
  }

  /**
   * Get my communities (as owner)
   */
  @Get('my/owned')
  @ApiOperation({ summary: 'Get my communities (as owner)' })
  @ApiResponseCustom(CommunityResponseDto, true)
  async getMyCommunities(
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponse<CommunityResponseDto[]>> {
    const communities =
      await this.communityService.getCommunitiesByOwner(userId);
    return BaseResponse.of(communities);
  }

  /**
   * Get followed communities
   */
  @Get('my/followed')
  @ApiOperation({ summary: 'Get followed communities' })
  @ApiResponseCustom(CommunityResponseDto, true)
  async getFollowedCommunities(
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponse<CommunityResponseDto[]>> {
    const communities =
      await this.communityService.getFollowedCommunities(userId);
    return BaseResponse.of(communities);
  }

  /**
   * Get all communities with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all communities with pagination' })
  @ApiPaginationResponse(CommunityResponseDto)
  async getAllCommunities(
    @Query() pagination: PaginationDto,
    @Query('type') type?: string,
    @Query('search') searchTerm?: string,
  ): Promise<BaseResponse<PaginationResponse<CommunityResponseDto>>> {
    const result = await this.communityService.getAllCommunities({
      page: pagination.page,
      limit: pagination.limit,
      type,
      searchTerm,
    });
    return BaseResponse.of(result);
  }

  /**
   * Delete community
   */
  @Delete(':communityId')
  @ApiOperation({ summary: 'Delete community' })
  @ApiResponseCustom()
  async deleteCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<void>> {
    await this.communityService.deleteCommunity(userId, communityId);
    return BaseResponse.ok();
  }
}
