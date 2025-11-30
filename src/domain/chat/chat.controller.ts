import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { IRequest } from '@shared/interface/request.interface';
import { CreateChannelRequest } from './request/create-channel.request';
import { SendMessageRequest } from './request/send-message.request';
import { AddParticipantsRequest } from './request/add-participants.request';
import { MarkAsReadRequest } from './request/mark-as-read.request';
import { UpdateMessageRequest } from './request/update-message.request';
import { ArchiveChannelRequest } from './request/archive-channel.request';
import { ChatChannelResponse, ChatMessageResponse } from './response/chat.response';
import { PaginatedMessagesResponse } from './response/paginated-messages.response';
import { BaseResponse } from '@shared/helper/response';
import { ApiExtraModelsCustom, ApiResponseCustom } from '@core/decorator/doc.decorator';
import { chatResponses } from './response';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModelsCustom(...chatResponses)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @Post('channels')
  @ApiOperation({ summary: 'Create a new chat channel' })
  @ApiResponseCustom(ChatChannelResponse)
  async createChannel(
    @Body() body: CreateChannelRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<ChatChannelResponse>> {
    const result = await this.chatService.createChannel(body, request);
    return result;
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get all channels for current user' })
  @ApiResponseCustom(ChatChannelResponse, true)
  async getMyChannels(@Req() request: IRequest): Promise<BaseResponse<ChatChannelResponse[]>> {
    return this.chatService.getMyChannels(request);
  }

  @Get('channels/:channelId')
  @ApiOperation({ summary: 'Get channel details by ID' })
  @ApiResponseCustom(ChatChannelResponse)
  async getChannelById(
    @Param('channelId') channelId: string,
    @Req() request: IRequest,
  ): Promise<BaseResponse<ChatChannelResponse>> {
    return this.chatService.getChannelById(channelId, request);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiResponseCustom(ChatMessageResponse)
  async sendMessage(
    @Body() body: SendMessageRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<ChatMessageResponse>> {
    const result = await this.chatService.sendMessage(body, request);

    return result;
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Get messages from a channel with pagination' })
  @ApiResponseCustom(PaginatedMessagesResponse)
  async getMessages(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('lastMessageId') lastMessageId?: string,
    @Req() request?: IRequest,
  ) {
    return this.chatService.getMessages(
      channelId,
      limit ? Number(limit) : undefined,
      lastMessageId,
      request,
    );
  }

  @Post('channels/read')
  @ApiOperation({ summary: 'Mark messages as read in a channel' })
  @ApiResponseCustom()
  async markAsRead(
    @Body() body: MarkAsReadRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<unknown>> {
    return this.chatService.markAsRead(body, request);
  }

  @Post('channels/participants')
  @ApiOperation({ summary: 'Add participants to a channel' })
  @ApiResponseCustom()
  async addParticipants(
    @Body() body: AddParticipantsRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<{ added: number }>> {
    const result = await this.chatService.addParticipants(body, request);

    return result;
  }

  @Post('channels/:channelId/leave')
  @ApiOperation({ summary: 'Leave a channel' })
  @ApiResponseCustom()
  async leaveChannel(
    @Param('channelId') channelId: string,
    @Req() request: IRequest,
  ): Promise<BaseResponse<unknown>> {
    return this.chatService.leaveChannel(channelId, request);
  }

  @Patch('messages')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponseCustom(ChatMessageResponse)
  async updateMessage(
    @Body() body: UpdateMessageRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<ChatMessageResponse>> {
    const result = await this.chatService.updateMessage(body, request);

    return result;
  }

  @Delete('channels/:channelId/messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponseCustom()
  async deleteMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Req() request: IRequest,
  ): Promise<BaseResponse<{ messageId: string }>> {
    const result = await this.chatService.deleteMessage({ channelId, messageId }, request);

    return result;
  }

  @Post('channels/archive')
  @ApiOperation({ summary: 'Archive a channel' })
  @ApiResponseCustom()
  async archiveChannel(
    @Body() body: ArchiveChannelRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<unknown>> {
    return this.chatService.archiveChannel(body, request);
  }

  @Get('channels/user/:userId')
  @ApiOperation({ summary: 'Get chat channels by user ID' })
  @ApiResponseCustom(ChatChannelResponse, true)
  async getChatChannelByUserId(
    @Param('userId') userId: string,
    @Req() request: IRequest,
  ): Promise<BaseResponse<ChatChannelResponse[]>> {
    return this.chatService.getChatChannelByUserId(userId, request);
  }
}
