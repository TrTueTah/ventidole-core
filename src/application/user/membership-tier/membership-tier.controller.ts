import { BaseResponse } from '@core/response/base-response';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { MembershipTierApplicationService } from './membership-tier.service';
import {
  CreateTierDto,
  UpdateTierPricingDto,
  UpdateTierDetailsDto,
  TierResponseDto,
} from './dto';

/**
 * MembershipTier Controller
 *
 * HTTP layer for membership tier operations.
 *
 * Responsibilities:
 * - Validate HTTP requests
 * - Extract user ID from token/session
 * - Call application service
 * - Return standardized responses
 */
@ApiTags('Membership Tier')
@ApiExtraModelsCustom(TierResponseDto)
@Controller('user/membership-tier')
export class MembershipTierController {
  constructor(private readonly tierService: MembershipTierApplicationService) {}

  /**
   * Create membership tier for community
   */
  @Post()
  @ApiOperation({ summary: 'Create membership tier (community owner only)' })
  @ApiResponseCustom(TierResponseDto)
  async createTier(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTierDto,
  ): Promise<BaseResponse<TierResponseDto>> {
    const tier = await this.tierService.createTier(userId, dto);
    return BaseResponse.of(tier);
  }

  /**
   * Get tier by community ID
   */
  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get membership tier for a community' })
  @ApiResponseCustom(TierResponseDto)
  async getTierByCommunity(
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<TierResponseDto | null>> {
    const tier = await this.tierService.getTierByCommunity(communityId);
    return BaseResponse.of(tier);
  }

  /**
   * Update tier pricing
   */
  @Patch(':tierId/pricing')
  @ApiOperation({ summary: 'Update tier pricing (community owner only)' })
  @ApiResponseCustom(TierResponseDto)
  async updatePricing(
    @CurrentUser('id') userId: string,
    @Param('tierId') tierId: string,
    @Body() dto: UpdateTierPricingDto,
  ): Promise<BaseResponse<TierResponseDto>> {
    const tier = await this.tierService.updateTierPricing(userId, tierId, dto);
    return BaseResponse.of(tier);
  }

  /**
   * Update tier details
   */
  @Patch(':tierId/details')
  @ApiOperation({ summary: 'Update tier details (community owner only)' })
  @ApiResponseCustom(TierResponseDto)
  async updateDetails(
    @CurrentUser('id') userId: string,
    @Param('tierId') tierId: string,
    @Body() dto: UpdateTierDetailsDto,
  ): Promise<BaseResponse<TierResponseDto>> {
    const tier = await this.tierService.updateTierDetails(userId, tierId, dto);
    return BaseResponse.of(tier);
  }

  /**
   * Deactivate tier
   */
  @Patch(':tierId/deactivate')
  @ApiOperation({ summary: 'Deactivate tier (community owner only)' })
  @ApiResponseCustom()
  async deactivate(
    @CurrentUser('id') userId: string,
    @Param('tierId') tierId: string,
  ): Promise<BaseResponse<void>> {
    await this.tierService.deactivateTier(userId, tierId);
    return BaseResponse.of(undefined);
  }

  /**
   * Activate tier
   */
  @Patch(':tierId/activate')
  @ApiOperation({ summary: 'Activate tier (community owner only)' })
  @ApiResponseCustom()
  async activate(
    @CurrentUser('id') userId: string,
    @Param('tierId') tierId: string,
  ): Promise<BaseResponse<void>> {
    await this.tierService.activateTier(userId, tierId);
    return BaseResponse.of(undefined);
  }
}
