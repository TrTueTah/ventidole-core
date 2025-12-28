import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { UpdateProfileResponseDto } from './dto/update-profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';

@ApiBearerAuth()
@ApiTags('User')
@Controller({ path: 'user', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  UserDto,
  UpdateStatusDto,
  UpdateProfileDto,
  UpdateProfileResponseDto,
)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiResponseCustom(UserDto)
  async getCurrentUser(@Req() req: IRequest): Promise<BaseResponse<UserDto>> {
    const result = await this.userService.getCurrentUser(req.user.id);
    return BaseResponse.of(result);
  }

  @Patch('status')
  @ApiResponseCustom(UserDto)
  async updateStatus(
    @Req() req: IRequest,
    @Body() updateStatusDto: UpdateStatusDto,
  ): Promise<BaseResponse<UserDto>> {
    const result = await this.userService.updateStatus(
      req.user.id,
      updateStatusDto,
    );
    return BaseResponse.of(result);
  }

  @Patch('profile')
  @ApiResponseCustom(UpdateProfileResponseDto)
  async updateProfile(
    @Req() req: IRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<BaseResponse<UpdateProfileResponseDto>> {
    const result = await this.userService.updateProfile(
      req.user.id,
      updateProfileDto,
    );
    return BaseResponse.of(result);
  }
}
