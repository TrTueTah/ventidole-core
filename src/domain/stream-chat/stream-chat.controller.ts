import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Roles } from '@core/decorator/role.decorator';
import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { Role } from 'src/db/prisma/enums';
import { StreamChannelDto } from './dto/channel.dto';
import { CreateCommunityChannelDto } from './dto/create-community-channel.dto';
import { CreateIdolChannelDto } from './dto/create-idol-channel.dto';
import { CreateStreamUserDto } from './dto/create-user.dto';
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
  CreateCommunityChannelDto,
  CreateIdolChannelDto,
)
export class StreamChatController {
  constructor(private readonly streamChatService: StreamChatService) {}

  @Post('token')
  @ApiResponseCustom(TokenDto)
  @ApiOperation({
    summary: 'Generate Stream Chat authentication token for current user',
  })
  async generateToken(@Req() req: IRequest): Promise<BaseResponse<TokenDto>> {
    const result = await this.streamChatService.generateToken(req.user.id);
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

  @Post('channels/community')
  @Roles(Role.ADMIN)
  @ApiResponseCustom(StreamChannelDto)
  @ApiOperation({
    summary: 'Create a community channel (ADMIN only)',
    description:
      'Creates a community channel and automatically adds all idols from the community with send permissions',
  })
  async createCommunityChannel(
    @Req() req: IRequest,
    @Body() request: CreateCommunityChannelDto,
  ): Promise<BaseResponse<StreamChannelDto>> {
    const result = await this.streamChatService.createCommunityChannel(
      req.user.id,
      request,
    );
    return BaseResponse.of(result as StreamChannelDto);
  }

  @Post('channels/idol')
  @Roles(Role.IDOL)
  @ApiResponseCustom(StreamChannelDto)
  @ApiOperation({
    summary: 'Create an idol channel (IDOL only)',
    description:
      'Creates an idol channel where the creator becomes owner. Members join as readonly by default',
  })
  async createIdolChannel(
    @Req() req: IRequest,
    @Body() request: CreateIdolChannelDto,
  ): Promise<BaseResponse<StreamChannelDto>> {
    const result = await this.streamChatService.createIdolChannel(
      req.user.id,
      request,
    );
    return BaseResponse.of(result as StreamChannelDto);
  }

  @Post('channels/:channelId/members/:memberId/grant-send-permission')
  @ApiResponseCustom()
  @ApiOperation({
    summary: 'Grant send message permission to a member',
    description:
      'For idol channels: only creator can grant. For community channels: any idol in the community can grant',
  })
  async grantSendPermission(
    @Req() req: IRequest,
    @Param('channelId') channelId: string,
    @Param('memberId') memberId: string,
  ): Promise<BaseResponse<{ success: boolean }>> {
    const result = await this.streamChatService.grantSendPermission(
      req.user.id,
      channelId,
      memberId,
    );
    return BaseResponse.of(result);
  }

  @Post('channels/:channelId/members/:memberId/revoke-send-permission')
  @ApiResponseCustom()
  @ApiOperation({
    summary: 'Revoke send message permission from a member',
    description:
      'For idol channels: only creator can revoke. For community channels: any idol in the community can revoke',
  })
  async revokeSendPermission(
    @Req() req: IRequest,
    @Param('channelId') channelId: string,
    @Param('memberId') memberId: string,
  ): Promise<BaseResponse<{ success: boolean }>> {
    const result = await this.streamChatService.revokeSendPermission(
      req.user.id,
      channelId,
      memberId,
    );
    return BaseResponse.of(result);
  }
}
