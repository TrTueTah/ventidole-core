import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { GenerateKnockTokenDto } from './dto/generate-token.dto';
import {
  RegisterFcmTokenDto,
  RegisterFcmTokenResponseDto,
} from './dto/register-fcm-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { WorkflowResponseDto } from './dto/workflow-response.dto';
import { KnockService } from './knock.service';

@ApiBearerAuth()
@ApiTags('Knock Notifications')
@Controller({ path: 'knock', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  GenerateKnockTokenDto,
  SendNotificationDto,
  WorkflowResponseDto,
  RegisterFcmTokenDto,
  RegisterFcmTokenResponseDto,
)
export class KnockController {
  constructor(private readonly knockService: KnockService) {}

  @Post('token')
  @ApiResponseCustom(GenerateKnockTokenDto)
  @ApiOperation({
    summary: 'Generate Knock authentication token for client SDK',
  })
  async generateToken(
    @Req() req: IRequest,
  ): Promise<BaseResponse<GenerateKnockTokenDto>> {
    const result = await this.knockService.generateToken(req.user.id);
    return BaseResponse.of(result);
  }

  @Post('fcm-token')
  @ApiResponseCustom(RegisterFcmTokenResponseDto)
  @ApiOperation({
    summary: 'Register FCM token for push notifications',
    description:
      'Register a Firebase Cloud Messaging (FCM) device token for the authenticated user to receive push notifications',
  })
  async registerFcmToken(
    @Req() req: IRequest,
    @Body() registerFcmTokenDto: RegisterFcmTokenDto,
  ): Promise<BaseResponse<RegisterFcmTokenResponseDto>> {
    const result = await this.knockService.registerFcmToken(
      req.user.id,
      registerFcmTokenDto.fcmToken,
    );
    return BaseResponse.of(result);
  }
}
