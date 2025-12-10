import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { ChatService } from './chat.service';
import { ChannelDto } from './dto/channel.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageDto } from './dto/message.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiBearerAuth()
@ApiTags('User Chat')
@Controller({ path: 'user/chat', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  ChannelDto,
  MessageDto,
  SendMessageDto,
  GetMessagesDto,
)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('channels')
  @ApiResponseCustom(ChannelDto, true)
  @ApiOperation({ summary: 'Get all chat channels for the current user' })
  async getChannels(
    @Req() req: IRequest,
  ): Promise<BaseResponse<ChannelDto[]>> {
    const result = await this.chatService.getUserChannels(req.user.id);
    return BaseResponse.of(result);
  }

  @Get('channels/:channelId/messages')
  @ApiResponseCustom(MessageDto, true)
  @ApiOperation({ summary: 'Get messages from a specific channel' })
  async getMessages(
    @Req() req: IRequest,
    @Param('channelId') channelId: string,
    @Query() query: GetMessagesDto,
  ): Promise<BaseResponse<MessageDto[]>> {
    const result = await this.chatService.getChannelMessages(
      req.user.id,
      channelId,
      query,
    );
    return BaseResponse.of(result);
  }

  @Post('channels/:channelId/messages')
  @ApiResponseCustom(MessageDto)
  @ApiOperation({ summary: 'Send a message to a channel' })
  async sendMessage(
    @Req() req: IRequest,
    @Param('channelId') channelId: string,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<BaseResponse<MessageDto>> {
    const result = await this.chatService.sendMessage(
      req.user.id,
      channelId,
      sendMessageDto,
    );
    return BaseResponse.of(result);
  }
}
