import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { StreamChannelDto } from './dto/channel.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateStreamUserDto } from './dto/create-user.dto';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { ManageMembersDto } from './dto/manage-members.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TokenDto } from './dto/token.dto';
import { UserDto } from './dto/user.dto';
import { StreamChatService } from './stream-chat.service';

@ApiBearerAuth()
@ApiTags('Stream Chat')
@Controller({ path: 'stream-chat', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  TokenDto,
  UserDto,
  StreamChannelDto,
  CreateStreamUserDto,
  CreateChannelDto,
  GenerateTokenDto,
  ManageMembersDto,
  SendMessageDto,
)
export class StreamChatController {
  constructor(private readonly streamChatService: StreamChatService) {}

  @Post('token')
  @ApiResponseCustom(TokenDto)
  @ApiOperation({ summary: 'Generate Stream Chat authentication token' })
  async generateToken(
    @Body() request: GenerateTokenDto,
  ): Promise<BaseResponse<TokenDto>> {
    const result = await this.streamChatService.generateToken(request.userId);
    return BaseResponse.of(result);
  }

  @Post('users')
  @ApiResponseCustom(UserDto)
  @ApiOperation({ summary: 'Create or update user in Stream Chat' })
  async createUser(
    @Body() request: CreateStreamUserDto,
  ): Promise<BaseResponse<UserDto>> {
    const user = await this.streamChatService.createOrUpdateUser(request);
    return BaseResponse.of(user.users[request.userId] as UserDto);
  }

  @Delete('users/:userId')
  @ApiResponseCustom()
  @ApiOperation({ summary: 'Delete user from Stream Chat' })
  async deleteUser(
    @Param('userId') userId: string,
  ): Promise<BaseResponse<null>> {
    await this.streamChatService.deleteUser(userId);
    return BaseResponse.ok();
  }

  @Post('channels')
  @ApiResponseCustom(StreamChannelDto)
  @ApiOperation({ summary: 'Create a new channel' })
  async createChannel(
    @Body() request: CreateChannelDto,
  ): Promise<BaseResponse<StreamChannelDto>> {
    const result = await this.streamChatService.createChannel(request);
    return BaseResponse.of(result as StreamChannelDto);
  }

  @Get('channels/:userId')
  @ApiResponseCustom(StreamChannelDto, true)
  @ApiOperation({ summary: 'Get all channels for a user' })
  async getUserChannels(
    @Param('userId') userId: string,
  ): Promise<BaseResponse<StreamChannelDto[]>> {
    const result = await this.streamChatService.getUserChannels(userId);
    return BaseResponse.of(result as StreamChannelDto[]);
  }

  @Delete('channels/:channelType/:channelId')
  @ApiResponseCustom()
  @ApiOperation({ summary: 'Delete a channel' })
  async deleteChannel(
    @Param('channelType') channelType: string,
    @Param('channelId') channelId: string,
  ): Promise<BaseResponse<null>> {
    await this.streamChatService.deleteChannel(channelType, channelId);
    return BaseResponse.ok();
  }

  @Post('channels/:channelType/:channelId/members')
  @ApiResponseCustom()
  @ApiOperation({ summary: 'Add members to a channel' })
  async addMembers(
    @Param('channelType') channelType: string,
    @Param('channelId') channelId: string,
    @Body() body: ManageMembersDto,
  ): Promise<BaseResponse<null>> {
    await this.streamChatService.addMembers(
      channelType,
      channelId,
      body.memberIds,
    );
    return BaseResponse.ok();
  }

  @Delete('channels/:channelType/:channelId/members')
  @ApiResponseCustom()
  @ApiOperation({ summary: 'Remove members from a channel' })
  async removeMembers(
    @Param('channelType') channelType: string,
    @Param('channelId') channelId: string,
    @Body() body: ManageMembersDto,
  ): Promise<BaseResponse<null>> {
    await this.streamChatService.removeMembers(
      channelType,
      channelId,
      body.memberIds,
    );
    return BaseResponse.ok();
  }

  @Get('channels/:channelType/:channelId/messages')
  @ApiResponseCustom()
  @ApiOperation({ summary: 'Get channel messages' })
  async getMessages(
    @Param('channelType') channelType: string,
    @Param('channelId') channelId: string,
    @Query('limit') limit?: number,
  ): Promise<BaseResponse<any>> {
    const result = await this.streamChatService.getChannelMessages(
      channelType,
      channelId,
      limit || 50,
    );
    return BaseResponse.of(result);
  }

  @Post('channels/:channelType/:channelId/messages')
  @ApiResponseCustom()
  @ApiOperation({ summary: 'Send a message to a channel' })
  async sendMessage(
    @Param('channelType') channelType: string,
    @Param('channelId') channelId: string,
    @Body() body: SendMessageDto,
  ): Promise<BaseResponse<any>> {
    const result = await this.streamChatService.sendMessage(
      channelType,
      channelId,
      body.userId,
      body.text,
    );
    return BaseResponse.of(result);
  }
}
