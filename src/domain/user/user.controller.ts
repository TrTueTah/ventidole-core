import { ApiExtraModelsCustom, ApiResponseCustom } from "@core/decorator/doc.decorator";
import { Body, Controller, Post, Get, Patch, Req, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiTags, ApiParam } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import { userResponses } from "./response/index.response";
import { UserService } from "./user.service";
import { UpdateStatusRequest } from "./request/update-status.request";
import { UpdateUserRequest } from "./request/update-user.request";
import { UpdateFanRequest } from "./request/update-fan.request";
import { UpdateIdolRequest } from "./request/update-idol.request";
import { GetUserResponse } from "./response/get-user.response";
import { UpdateUserResponse } from "./response/update-user.response";
import { UpdateFanResponse } from "./response/update-fan.response";
import { UpdateIdolResponse } from "./response/update-idol.response";
import { Role } from "src/db/prisma/enums";
import { Roles } from "@core/decorator/role.decorator";
import { IRequest } from "@shared/interface/request.interface";

@ApiBearerAuth()
@ApiTags('User')
@ApiExtraModelsCustom(...userResponses)
@Controller({ path: 'user', version: ApiVersion.V1 })
@Roles(Role.FAN, Role.IDOL, Role.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiResponseCustom(GetUserResponse)
  getCurrentUser(@Req() request: IRequest) {
    return this.userService.getCurrentUser(request);
  }

  @Get(':userId')
  @ApiResponseCustom(GetUserResponse)
  @ApiParam({ name: 'userId', description: 'User ID' })
  getUserById(
    @Param('userId') userId: string,
    @Req() request: IRequest
  ) {
    return this.userService.getUserById(userId, request);
  }

  @Patch('profile')
  @ApiResponseCustom(UpdateUserResponse)
  @ApiBody({ type: UpdateUserRequest })
  updateProfile(
    @Body() body: UpdateUserRequest,
    @Req() request: IRequest
  ) {
    return this.userService.updateProfile(body, request);
  }

  @Patch('fan')
  @Roles(Role.FAN)
  @ApiResponseCustom(UpdateFanResponse)
  @ApiBody({ type: UpdateFanRequest })
  updateFanProfile(
    @Body() body: UpdateFanRequest,
    @Req() request: IRequest
  ) {
    return this.userService.updateFanProfile(body, request);
  }

  @Patch('idol')
  @Roles(Role.IDOL)
  @ApiResponseCustom(UpdateIdolResponse)
  @ApiBody({ type: UpdateIdolRequest })
  updateIdolProfile(
    @Body() body: UpdateIdolRequest,
    @Req() request: IRequest
  ) {
    return this.userService.updateIdolProfile(body, request);
  }

  @Post('update-status')
  @ApiResponseCustom()
  @ApiBody({ type: UpdateStatusRequest })
  updateStatus(@Body() request: UpdateStatusRequest) {
    return this.userService.updateStatus(request);
  }
}