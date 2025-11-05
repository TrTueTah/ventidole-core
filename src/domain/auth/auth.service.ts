import { Injectable } from "@nestjs/common";
import { SignInRequest } from "./request/sign-in.request";
import { SignUpRequest } from "./request/sign-up.request";
import { SendVerificationRequest } from "./request/send-verification.request";
import { ConfirmVerificationRequest } from "./request/confirm-verification.request";
import { RefreshTokenRequest } from "./request/refresh-token.request";
import { ResetPasswordRequest } from "./request/reset-password.request";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "@shared/service/redis/redis.service";
import { OtpService } from "@shared/service/otp/otp.service";
import { TokenService } from "@shared/service/token/token.service";
import { VerificationProducer } from "@shared/service/queue/verification/verification.producer";
import { PrismaService } from "@shared/service/prisma/prisma.service";
import { CustomError } from "@shared/helper/error";
import { ErrorCode } from "@shared/enum/error-code.enum";
import { BaseResponse } from "@shared/helper/response";
import { SignInResponse } from "./response/sign-in.response";
import { hashPassword, verifyPassword } from "@shared/helper/hash";
import { ENVIRONMENT } from "@core/config/env.config";
import { RedisKey } from "@shared/enum/redis-key.enum";
import moment from "moment";
import { VerificationCodeResponse } from "./response/verification-code.response";
import { ConfirmVerificationResponse } from "./response/confirm-verification.response";
import { IJwtDecoded } from "@shared/interface/jwt-payload.interface";
import { TokenIssuer } from "@shared/enum/token.enum";
import { VerificationType } from "src/db/prisma/enums";
import { AccountModel } from "src/db/prisma/models";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly producer: VerificationProducer,
    private prisma: PrismaService,
  ) {}
  async signIn(request: SignInRequest) {
    try {
      const account = await this.prisma.account.findUnique({
        where: { email: request.email, isActive: true, isDeleted: false },
      });
      if (!account) throw new CustomError(ErrorCode.InvalidEmailOrPassword);

      await this.validatePassword(account, request.password);

      const [accessToken, refreshToken] = await this.generateTokens(account);

      const response = new SignInResponse();
      response.id = account.id;
      response.role = account.role;
      response.accessToken = accessToken;
      response.refreshToken = refreshToken;

      return BaseResponse.of(response);
    } catch (error) {
      throw error;
    }
  }

  async signUp(request: SignUpRequest) {
    try {
      await this.validateSignUp(request);
      const hashedPassword = await hashPassword(request.password);
      const account = await this.prisma.account.create({
        data: SignUpRequest.toCreateInput(request, hashedPassword),
      });

      const [[accessToken, refreshToken]] = await Promise.all([
        // this.createDefaultNotiSettings(account, request.timezone),
        this.generateTokens(account),
      ]);

      const response = new SignInResponse();
      response.id = account.id;
      response.role = account.role;
      response.accessToken = accessToken;
      response.refreshToken = refreshToken;
      
      return BaseResponse.of(response);
    } catch (error) {
      throw error;
    }
  }

  async sendVerification(request: SendVerificationRequest) {
    try {
      const expireAt = await this.otpService.sendOtp(
        request.email!,
        request.verificationType,
      );
      return BaseResponse.of(
        VerificationCodeResponse.transformOtpData(expireAt),
      );
    } catch (error) {
      throw error;
    }
  }

  async confirmVerification(request: ConfirmVerificationRequest) {
    try {
      await this.otpService.confirmOtp(
        request.email!,
        request.code,
        request.verificationType,
      );

      if (request.verificationType === VerificationType.FIND_EMAIL) {
        const account = await this.prisma.account.findFirst({
          where: { email: request.email, isDeleted: false },
        });
        const response = new ConfirmVerificationResponse();
        if (account) {
          response.id = account.id;
          response.role = account.role;
          response.email = account.email;
          response.name = account.name ?? undefined;
        }

        return account
          ? BaseResponse.of(response)
          : BaseResponse.ok();
      }

      return BaseResponse.ok();
    } catch (error) {
      throw error;
    }
  }

  async refreshNewToken(request: RefreshTokenRequest) {
    try {
      const { token, refreshToken } = request;

      const decodedToken = this.jwtService.decode<IJwtDecoded>(token, {
        complete: true,
      });
      if (!decodedToken || typeof decodedToken !== 'object')
        throw new CustomError(ErrorCode.InvalidDecodeToken);

      let secret = '';

      if (decodedToken.payload.iss === TokenIssuer.Access)
        secret = ENVIRONMENT.JWT_SECRET;
      else if (decodedToken.payload.iss === TokenIssuer.Sensitive)
        secret = ENVIRONMENT.JWT_SENSITIVE_SECRET;

      if (!secret) throw new CustomError(ErrorCode.InvalidTokenSecret);

      const refreshTokenPayload = this.tokenService.validateRefreshToken(
        token,
        refreshToken,
        secret,
      );

      const account = await this.prisma.account.findFirst({
        where: {
          id: refreshTokenPayload.sub,
          isActive: true,
          isDeleted: false,
        },
      });
      if (!account) throw new CustomError(ErrorCode.Unauthenticated);

      const [newAccessToken, newRefreshToken] =
        await this.generateTokens(account);
      
      const response = new SignInResponse();
      response.id = account.id;
      response.role = account.role;
      response.accessToken = newAccessToken;
      response.refreshToken = newRefreshToken;
      return BaseResponse.of(response);
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(request: ResetPasswordRequest) {
    try {
      const { email, password } = request;
      await this.validateResetPassword(request);
      const hashedPassword = await hashPassword(password);

      await this.prisma.account.update({
        where: { email },
        data: { password: hashedPassword },
      });
      return BaseResponse.ok();
    } catch (error) {
      throw error;
    }
  }

  private async validatePassword(account: AccountModel, password: string) {
    const isMatch = await verifyPassword(password, account.password);
    if (!isMatch) throw new CustomError(ErrorCode.InvalidEmailOrPassword);
  }

  private async generateTokens(account: AccountModel) {
    const accessToken = this.tokenService.generateAccessToken(account);
    const refreshToken = this.tokenService.generateRefreshToken(
      account,
      accessToken,
      ENVIRONMENT.JWT_SECRET,
    );

    await this.redisService.set(
      `${RedisKey.Account}${account.id}`,
      account,
      ENVIRONMENT.JWT_EXPIRED,
    );

    return [accessToken, refreshToken];
  }

  private async validateSignUp(request: SignUpRequest) {
    try {
      const { phoneNumber, email } = request;

      await this.validatePrevVerification(
        email,
        VerificationType.REGISTER_ACCOUNT,
      );

      const accountEmailExisted = await this.prisma.account.findUnique({
        where: { email, isActive: true, isDeleted: false },
        select: { id: true },
      });

      if (accountEmailExisted) throw new CustomError(ErrorCode.ExistedEmail);

      const accountPhoneNumberExisted = await this.prisma.account.findFirst({
        where: { phoneNumber, isActive: true, isDeleted: false },
        select: { id: true },
      });

      if (accountPhoneNumberExisted)
        throw new CustomError(ErrorCode.ExistedPhoneNumber);
    } catch (error) {
      throw error;
    }
  }

  private async validatePrevVerification(
    email: string,
    type: VerificationType,
  ) {
    try {
      const prevVerification = await this.prisma.verification.findFirst({
        where: { email, type, isActive: false },
        orderBy: { createdAt: 'desc' },
      });

      if (!prevVerification)
        throw new CustomError(ErrorCode.VerificationNotFound);
      if (
        moment().isAfter(
          moment
            .unix(
              prevVerification.confirmedAt
                ? Math.floor(
                    new Date(prevVerification.confirmedAt).getTime() / 1000,
                  )
                : 0,
            )
            .add({ seconds: ENVIRONMENT.VERIFICATION_SESSION }),
        )
      )
        throw new CustomError(ErrorCode.VerificationSessionExpired);
    } catch (error) {
      throw error;
    }
  }

  private async validateResetPassword(request: ResetPasswordRequest) {
    try {
      const { email } = request;

      await this.validatePrevVerification(
        email,
        VerificationType.RESET_PASSWORD,
      );

      const accountExisted = await this.prisma.account.findFirst({
        where: {
          email,
          isActive: true,
          isDeleted: false,
        },
        select: { id: true }, 
      });

      if (!accountExisted)
        throw new CustomError(ErrorCode.AccountNotFound, email);
    } catch (error) {
      throw error;
    }
  }
}