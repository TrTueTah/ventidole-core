import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/service/prisma/prisma.service";
import { UpdateStatusRequest } from "./request/update-status.request";
import { CustomError } from "@shared/helper/error";
import { ErrorCode } from "@shared/enum/error-code.enum";
import { UserStatus } from "@shared/enum/user-status.enum";
import { BaseResponse } from "@shared/helper/response";

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async updateStatus(request: UpdateStatusRequest) {
    const { userId, status } = request;
    const user = await this.prisma.account.findUnique({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound)
    }
    await this.prisma.account.update({
      where: { id: userId },
      data: { isOnline: status === UserStatus.ACTIVE ? true : false },
    });
    return BaseResponse.ok();
  }
}