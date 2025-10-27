import { ApiExtraModelsCustom, ApiResponseCustom } from "@core/decorator/doc.decorator";
import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiTags } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import { userResponses } from "./response/index.response";
import { UserService } from "./user.service";
import { UpdateStatusRequest } from "./request/update-status.request";
import { Role } from "@database/prisma/enums";
import { Roles } from "@core/decorator/role.decorator";

@ApiBearerAuth()
@ApiTags('User')
@ApiExtraModelsCustom(...userResponses)
@Controller({ path: 'user', version: ApiVersion.V1 })
@Roles(Role.FAN, Role.IDOL)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('update-status')
  @ApiResponseCustom()
  @ApiBody({ type: UpdateStatusRequest })
  updateStatus(@Body() request: UpdateStatusRequest) {
    return this.userService.updateStatus(request);
  }
}