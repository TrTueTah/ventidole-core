import { BaseResponse } from '@application/shared/dto/base-response.dto';
import { PaginationDto, PaginationResponse } from '@application/shared/dto/pagination.dto';
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
@Controller('user/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityApplicationService) {}

  /**
   * Create new community
   *
   * POST /user/community
   */
  @Post()
  async createCommunity(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommunityDto,
  ): Promise<BaseResponse<CommunityResponseDto>> {
    const community = await this.communityService.createCommunity(userId, dto);
    return BaseResponse.of(community);
  }

  /**
   * Get community by ID
   *
   * GET /user/community/:communityId
   */
  @Get(':communityId')
  async getCommunity(
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<CommunityResponseDto>> {
    const community = await this.communityService.getCommunity(communityId);
    return BaseResponse.of(community);
  }

  /**
   * Update community profile
   *
   * PATCH /user/community/:communityId
   */
  @Patch(':communityId')
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
   *
   * POST /user/community/:communityId/follow
   */
  @Post(':communityId/follow')
  async followCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<void>> {
    await this.communityService.followCommunity(userId, communityId);
    return BaseResponse.ok();
  }

  /**
   * Unfollow community
   *
   * DELETE /user/community/:communityId/follow
   */
  @Delete(':communityId/follow')
  async unfollowCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<void>> {
    await this.communityService.unfollowCommunity(userId, communityId);
    return BaseResponse.ok();
  }

  /**
   * Get my communities (as owner)
   *
   * GET /user/community/my/owned
   */
  @Get('my/owned')
  async getMyCommunities(
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponse<CommunityResponseDto[]>> {
    const communities =
      await this.communityService.getCommunitiesByOwner(userId);
    return BaseResponse.of(communities);
  }

  /**
   * Get followed communities
   *
   * GET /user/community/my/followed
   */
  @Get('my/followed')
  async getFollowedCommunities(
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponse<CommunityResponseDto[]>> {
    const communities =
      await this.communityService.getFollowedCommunities(userId);
    return BaseResponse.of(communities);
  }

  /**
   * Get all communities with pagination
   *
   * GET /user/community
   */
  @Get()
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
   *
   * DELETE /user/community/:communityId
   */
  @Delete(':communityId')
  async deleteCommunity(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<void>> {
    await this.communityService.deleteCommunity(userId, communityId);
    return BaseResponse.ok();
  }
}
