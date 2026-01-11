import { BaseResponse } from '@core/response/base-response';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import { PaginationDto, PaginationResponse } from '@application/shared/dto/pagination.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
  ApiPaginationResponse,
} from '@core/decorator/doc.decorator';
import { SubscriptionApplicationService } from './subscription.service';
import {
  CreateSubscriptionDto,
  SubscriptionResponseDto,
} from './dto';

/**
 * Subscription Controller
 *
 * HTTP layer for subscription operations.
 *
 * Responsibilities:
 * - Validate HTTP requests
 * - Extract user ID from token/session
 * - Call application service
 * - Return standardized responses
 */
@ApiTags('Subscription')
@ApiExtraModelsCustom(SubscriptionResponseDto)
@Controller('user/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionApplicationService) {}

  /**
   * Subscribe to a community
   */
  @Post()
  @ApiOperation({ summary: 'Subscribe to a community' })
  @ApiResponseCustom(SubscriptionResponseDto)
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<BaseResponse<SubscriptionResponseDto>> {
    const subscription = await this.subscriptionService.subscribe(userId, dto);
    return BaseResponse.of(subscription);
  }

  /**
   * Cancel subscription
   */
  @Delete(':subscriptionId')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponseCustom()
  async cancelSubscription(
    @CurrentUser('id') userId: string,
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<BaseResponse<void>> {
    await this.subscriptionService.cancelSubscription(userId, subscriptionId);
    return BaseResponse.of(undefined);
  }

  /**
   * Get my subscriptions
   */
  @Get('me')
  @ApiOperation({ summary: 'Get my subscriptions' })
  @ApiPaginationResponse(SubscriptionResponseDto)
  async getMySubscriptions(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<SubscriptionResponseDto>>> {
    const result = await this.subscriptionService.getMySubscriptions(
      userId,
      pagination.page,
      pagination.limit,
    );
    return BaseResponse.of(result);
  }

  /**
   * Get community subscribers
   */
  @Get('community/:communityId')
  @ApiOperation({ summary: 'Get community subscribers (community owner only)' })
  @ApiPaginationResponse(SubscriptionResponseDto)
  async getCommunitySubscribers(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
    @Query() pagination: PaginationDto,
  ): Promise<BaseResponse<PaginationResponse<SubscriptionResponseDto>>> {
    const result = await this.subscriptionService.getCommunitySubscribers(
      userId,
      communityId,
      pagination.page,
      pagination.limit,
    );
    return BaseResponse.of(result);
  }

  /**
   * Check subscription status for a community
   */
  @Get('check/:communityId')
  @ApiOperation({ summary: 'Check if I have access to a community' })
  @ApiResponseCustom()
  async checkSubscriptionStatus(
    @CurrentUser('id') userId: string,
    @Param('communityId') communityId: string,
  ): Promise<BaseResponse<{ hasAccess: boolean; subscription: SubscriptionResponseDto | null }>> {
    const result = await this.subscriptionService.checkSubscriptionStatus(
      userId,
      communityId,
    );
    return BaseResponse.of(result);
  }
}
