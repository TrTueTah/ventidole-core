import { PaginationResponse } from '@application/shared/dto/pagination.dto';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Public } from '@core/decorator/public.decorator';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { BaseResponse } from '@core/response/base-response';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommunityApplicationService } from './community.service';
import {
  BulkFollowCommunitiesDto,
  BulkFollowResultDto,
  CommunityResponseDto,
  CreateCommunityDto,
  GetCommunitiesDto,
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
 *
 * Authentication:
 * - Most endpoints require authentication (JwtAuthGuard at controller level)
 * - Public endpoints (get community by ID, list all communities) are marked with @Public()
 */
@ApiTags('Community')
@ApiExtraModelsCustom(CommunityResponseDto, BulkFollowResultDto)
@Controller('user/community')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommunityController {
  constructor(private readonly communityService: CommunityApplicationService) {}

  /**
   * Create new community
   *
   * Note: Only admins can create communities (enforced by policy)
   */
  @Post()
  @ApiOperation({ summary: 'Create new community' })
  @ApiResponseCustom(CommunityResponseDto)
  async createCommunity(
    @Body() dto: CreateCommunityDto,
  ): Promise<BaseResponse<CommunityResponseDto>> {
    const community = await this.communityService.createCommunity(dto);
    return BaseResponse.of(community);
  }

  /**
   * Get community by ID
   *
   * Public endpoint - no authentication required
   */
  @Get(':communityId')
  @Public()
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
   * Bulk follow multiple communities
   *
   * Used for "Choose Community" onboarding flow.
   * Follows multiple communities in a single request.
   */
  @Post('follow/bulk')
  @ApiOperation({
    summary: 'Bulk follow multiple communities',
    description:
      'Follow multiple communities at once. Used for "Choose Community" onboarding screen. Returns success/failure counts and any errors.',
  })
  @ApiResponseCustom(BulkFollowResultDto)
  async bulkFollowCommunities(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkFollowCommunitiesDto,
  ): Promise<BaseResponse<BulkFollowResultDto>> {
    const result = await this.communityService.bulkFollowCommunities(
      userId,
      dto.communityIds,
    );
    return BaseResponse.of(result);
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
   *
   * Public endpoint - no authentication required
   * Used for community discovery and "Choose Community" screen
   *
   * If authenticated: includes isFollowed field for each community
   * If not authenticated: isFollowed field will be undefined
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all communities with pagination' })
  @ApiPaginationResponse(CommunityResponseDto)
  async getAllCommunities(
    @Query() query: GetCommunitiesDto,
    @CurrentUser('id') userId?: string,
  ): Promise<PaginationResponse<CommunityResponseDto>> {
    // Only pass userId if it's a non-empty string
    const validUserId =
      userId && typeof userId === 'string' && userId.trim()
        ? userId
        : undefined;

    return await this.communityService.getAllCommunities({
      page: query.page,
      limit: query.limit,
      type: query.type,
      searchTerm: query.search,
      userId: validUserId,
    });
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
