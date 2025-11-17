import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminStatisticsService } from './admin-statistics.service';
import { Roles } from '@core/decorator/role.decorator';
import { Role } from 'src/db/prisma/enums';
import { BaseResponse } from '@shared/helper/response';
import { ApiVersion } from '@shared/enum/api-version.enum';

@ApiTags('Admin Statistics')
@Controller({ path: 'admin/statistics', version: ApiVersion.V1 })
export class AdminStatisticsController {
  constructor(private readonly adminStatisticsService: AdminStatisticsService) {}

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get platform statistics (Admin only)' })
  @ApiResponse({ status: 200 })
  async getStatistics(): Promise<BaseResponse<any>> {
    return this.adminStatisticsService.getStatistics();
  }
}