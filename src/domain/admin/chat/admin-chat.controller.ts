import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { AdminChatService } from './admin-chat.service';
import { CreateCommunityChannelDto } from './dto/create-community-channel.dto';

@ApiBearerAuth()
@ApiTags('Admin Chat Management')
@Controller({ path: 'admin/chat', version: ApiVersion.V1 })
@ApiExtraModelsCustom(CreateCommunityChannelDto)
export class AdminChatController {
  constructor(private readonly adminChatService: AdminChatService) {}

  @Post('community-channel')
  @ApiResponseCustom()
  @ApiOperation({
    summary:
      'Create a chat channel for a community and add all idols as participants',
  })
  async createCommunityChannel(
    @Body() createCommunityChannelDto: CreateCommunityChannelDto,
  ): Promise<BaseResponse<any>> {
    const result = await this.adminChatService.createCommunityChannel(
      createCommunityChannelDto,
    );
    return BaseResponse.of(result);
  }
}
