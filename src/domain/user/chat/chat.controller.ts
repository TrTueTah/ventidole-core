import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Roles } from '@core/decorator/role.decorator';
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { Role } from 'src/db/prisma/enums';
import { ChatService } from './chat.service';
import { ChannelDto } from './dto/channel.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
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
  CreateChannelDto,
)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('my-channels')
  @ApiResponseCustom(ChannelDto, true)
  @Roles(Role.IDOL)
  @ApiOperation({
    summary: 'Get channels owned by the current user (idol only)',
  })
  async getMyChannels(
    @Req() req: IRequest,
  ): Promise<BaseResponse<ChannelDto[]>> {
    const result = await this.chatService.getMyChannels(req.user.id);
    return BaseResponse.of(result);
  }

  @Get('joined-channels')
  @ApiResponseCustom(ChannelDto, true)
  @ApiOperation({ summary: 'Get channels that the current user has joined' })
  async getJoinedChannels(
    @Req() req: IRequest,
  ): Promise<BaseResponse<ChannelDto[]>> {
    const result = await this.chatService.getJoinedChannels(req.user.id);
    return BaseResponse.of(result);
  }

  @Post('channels')
  @ApiResponseCustom(ChannelDto)
  @Roles(Role.IDOL)
  @ApiOperation({
    summary: 'Create a new channel (idol only)',
    description:
      'Creates a new chat channel. Only idols can create channels. Can be a personal channel or a community channel.',
  })
  async createChannel(
    @Req() req: IRequest,
    @Body() createChannelDto: CreateChannelDto,
  ): Promise<BaseResponse<ChannelDto>> {
    const result = await this.chatService.createChannel(
      req.user.id,
      createChannelDto,
    );
    return BaseResponse.of(result);
  }

  @Get('channels/:channelId/messages')
  @ApiPaginationResponse(MessageDto)
  @ApiOperation({ summary: 'Get messages from a specific channel' })
  async getMessages(
    @Req() req: IRequest,
    @Param('channelId') channelId: string,
    @Query() query: GetMessagesDto,
  ): Promise<PaginationResponse<MessageDto>> {
    const result = await this.chatService.getChannelMessages(
      req.user.id,
      channelId,
      query,
    );
    return result;
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

  @Post('channels/:channelId/read')
  @ApiResponseCustom()
  @ApiOperation({ summary: 'Mark channel as read' })
  async markChannelAsRead(
    @Req() req: IRequest,
    @Param('channelId') channelId: string,
  ): Promise<BaseResponse<null>> {
    await this.chatService.markChannelAsRead(req.user.id, channelId);
    return BaseResponse.of(null);
  }
}
