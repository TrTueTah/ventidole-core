import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { EcommerceAnalyticsDto } from './dto/ecommerce-analytics.dto';
import { SocialAnalyticsDto } from './dto/social-analytics.dto';

@ApiBearerAuth()
@ApiTags('Admin Analytics')
@Controller({ path: 'admin/analytics', version: ApiVersion.V1 })
@ApiExtraModelsCustom(EcommerceAnalyticsDto, SocialAnalyticsDto)
export class AdminAnalyticsController {
  constructor(
    private readonly adminAnalyticsService: AdminAnalyticsService,
  ) {}

  @Get('ecommerce')
  @ApiOperation({
    summary: 'Get ecommerce analytics',
    description:
      'Retrieve ecommerce analytics data including revenue, orders, customers, and sales trends',
  })
  @ApiResponseCustom(EcommerceAnalyticsDto)
  async getEcommerceAnalytics(
    @Query() filters: AnalyticsFilterDto,
  ): Promise<BaseResponse<EcommerceAnalyticsDto>> {
    const result =
      await this.adminAnalyticsService.getEcommerceAnalytics(filters);
    return BaseResponse.of(result);
  }

  @Get('social')
  @ApiOperation({
    summary: 'Get social analytics',
    description:
      'Retrieve social analytics data including posts, engagement, communities, and member trends',
  })
  @ApiResponseCustom(SocialAnalyticsDto)
  async getSocialAnalytics(
    @Query() filters: AnalyticsFilterDto,
  ): Promise<BaseResponse<SocialAnalyticsDto>> {
    const result =
      await this.adminAnalyticsService.getSocialAnalytics(filters);
    return BaseResponse.of(result);
  }
}
