import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { IRequest } from '@shared/interface/request.interface';
import { CreateChannelRequest } from './request/create-channel.request';
import { SendMessageRequest } from './request/send-message.request';
import { AddParticipantsRequest } from './request/add-participants.request';
import { MarkAsReadRequest } from './request/mark-as-read.request';
import { ChatChannelResponse, ChatMessageResponse } from './response/chat.response';
import { BaseResponse } from '@shared/helper/response';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('channels')
  @ApiOperation({ summary: 'Create a new chat channel' })
  @ApiResponse({ status: 201, type: ChatChannelResponse })
  async createChannel(
    @Body() body: CreateChannelRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<any>> {
    const result = await this.chatService.createChannel(body, request);
    
    // Notify participants via WebSocket
    if (body.participantIds) {
      body.participantIds.forEach(userId => {
        this.chatGateway.emitNewChannel(userId, result.data);
      });
    }
    
    return result;
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get all channels for current user' })
  @ApiResponse({ status: 200, type: [ChatChannelResponse] })
  async getMyChannels(@Req() request: IRequest): Promise<BaseResponse<any[]>> {
    return this.chatService.getMyChannels(request);
  }

  @Get('channels/:channelId')
  @ApiOperation({ summary: 'Get channel details by ID' })
  @ApiResponse({ status: 200, type: ChatChannelResponse })
  async getChannelById(
    @Param('channelId') channelId: string,
    @Req() request: IRequest,
  ): Promise<BaseResponse<any>> {
    return this.chatService.getChannelById(channelId, request);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiResponse({ status: 201, type: ChatMessageResponse })
  async sendMessage(
    @Body() body: SendMessageRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<any>> {
    const result = await this.chatService.sendMessage(body, request);
    
    // Broadcast message via WebSocket
    this.chatGateway.emitNewMessage(body.channelId, result.data);
    
    return result;
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Get messages from a channel' })
  @ApiResponse({ status: 200, type: [ChatMessageResponse] })
  async getMessages(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
    @Query('lastMessageId') lastMessageId?: string,
    @Req() request?: IRequest,
  ): Promise<BaseResponse<any[]>> {
    return this.chatService.getMessages(
      channelId,
      limit ? Number(limit) : 50,
      lastMessageId,
      request,
    );
  }

  @Post('channels/read')
  @ApiOperation({ summary: 'Mark messages as read in a channel' })
  @ApiResponse({ status: 200 })
  async markAsRead(
    @Body() body: MarkAsReadRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<unknown>> {
    return this.chatService.markAsRead(body, request);
  }

  @Post('channels/participants')
  @ApiOperation({ summary: 'Add participants to a channel' })
  @ApiResponse({ status: 200 })
  async addParticipants(
    @Body() body: AddParticipantsRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<any>> {
    const result = await this.chatService.addParticipants(body, request);
    
    // Notify new participants via WebSocket
    body.userIds.forEach(userId => {
      this.chatGateway.emitNewChannel(userId, { channelId: body.channelId });
    });
    
    return result;
  }

  @Post('channels/:channelId/leave')
  @ApiOperation({ summary: 'Leave a channel' })
  @ApiResponse({ status: 200 })
  async leaveChannel(
    @Param('channelId') channelId: string,
    @Req() request: IRequest,
  ): Promise<BaseResponse<unknown>> {
    return this.chatService.leaveChannel(channelId, request);
  }
}
