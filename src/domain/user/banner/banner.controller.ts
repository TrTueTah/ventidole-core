import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { BannerService } from './banner.service';
import { UserBannerDto } from './dto/banner.dto';

@ApiBearerAuth()
@ApiTags('User Banner')
@Controller({ path: 'user/banner', version: ApiVersion.V1 })
@ApiExtraModelsCustom(UserBannerDto)
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get('active')
  @ApiResponseCustom([UserBannerDto])
  async getActiveBanners(): Promise<BaseResponse<UserBannerDto[]>> {
    const result = await this.bannerService.getActiveBanners();
    return BaseResponse.of(result);
  }
}
