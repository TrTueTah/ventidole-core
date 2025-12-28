import { ENVIRONMENT } from '@core/config/env.config';
import { StreamChatService } from '@domain/stream-chat/stream-chat.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { RedisKey } from '@shared/enum/redis-key.enum';
import { TokenIssuer } from '@shared/enum/token.enum';
import { CustomError } from '@shared/helper/error';
import { hashPassword, verifyPassword } from '@shared/helper/hash';
import { BaseResponse } from '@shared/helper/response';
import { IJwtDecoded } from '@shared/interface/jwt-payload.interface';
import { GetStreamNotificationService } from '@shared/service/getstream-notification/getstream-notification.service';
import { KnockUserService } from '@shared/service/knock-workflow/knock-user.service';
import { OtpService } from '@shared/service/otp/otp.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { RedisService } from '@shared/service/redis/redis.service';
import { TokenService } from '@shared/service/token/token.service';
import moment from 'moment';
import { VerificationType } from 'src/db/prisma/enums';
import { UserModel } from 'src/db/prisma/models';
import { ChangePasswordRequest } from './request/change-password.request';
import { ConfirmVerificationRequest } from './request/confirm-verification.request';
import { RefreshTokenRequest } from './request/refresh-token.request';
import { ResetPasswordRequest } from './request/reset-password.request';
import { SendVerificationRequest } from './request/send-verification.request';
import { SignInRequest } from './request/sign-in.request';
import { SignUpRequest } from './request/sign-up.request';
import { ConfirmVerificationResponse } from './response/confirm-verification.response';
import { SignInResponse } from './response/sign-in.response';
import { VerificationCodeResponse } from './response/verification-code.response';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly getStreamNotificationService: GetStreamNotificationService,
    private readonly knockUserService: KnockUserService,
    private readonly streamChatService: StreamChatService,
  ) {}
  async signIn(request: SignInRequest) {
    const user = await this.prisma.user.findFirst({
      where: { email: request.email, isActive: true, isDeleted: false },
    });
    if (!user) throw new CustomError(ErrorCode.InvalidEmailOrPassword);

    await this.validatePassword(user, request.password);

    const [accessToken, refreshToken] = await this.generateTokens(user);

    const response = new SignInResponse();
    response.id = user.id;
    response.role = user.role;
    response.accessToken = accessToken;
    response.refreshToken = refreshToken;

    return BaseResponse.of(response);
  }

  async adminSignIn(request: SignInRequest) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: request.email,
        isActive: true,
        isDeleted: false,
        role: 'ADMIN',
      },
    });
    if (!user) throw new CustomError(ErrorCode.InvalidEmailOrPassword);

    await this.validatePassword(user, request.password);

    const [accessToken, refreshToken] = await this.generateTokens(user);

    const response = new SignInResponse();
    response.id = user.id;
    response.role = user.role;
    response.accessToken = accessToken;
    response.refreshToken = refreshToken;

    return BaseResponse.of(response);
  }

  async signUp(request: SignUpRequest) {
    await this.validateSignUp(request);
    const hashedPassword = await hashPassword(request.password);

    // Create User and Fan in a transaction
    const user = await this.prisma.user.create({
      data: {
        email: request.email,
        password: hashedPassword,
        username: request.username,
        role: 'FAN',
      },
    });

    // Initialize notification and messaging infrastructure for new user
    await this.initializeUserMessaging(user);

    const [accessToken, refreshToken] = await this.generateTokens(user);

    const response = new SignInResponse();
    response.id = user.id;
    response.role = user.role;
    response.accessToken = accessToken;
    response.refreshToken = refreshToken;

    return BaseResponse.of(response);
  }

  /**
   * Initialize messaging and notification infrastructure for a new user
   * Creates GetStream notification channel, registers in Knock, and creates GetStream chat user
   */
  private async initializeUserMessaging(user: UserModel): Promise<void> {
    try {
      this.logger.log(
        `Initializing messaging infrastructure for user ${user.id}`,
      );

      // 1. Create GetStream notification channel for real-time events
      await this.getStreamNotificationService.createNotificationChannel(
        user.id,
      );

      // 2. Register user in Knock for multi-channel notifications
      await this.knockUserService.registerUser({
        userId: user.id,
        email: user.email,
        name: user.username,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });

      // 3. Create user in GetStream Chat for messaging
      await this.streamChatService.createOrUpdateUser({
        userId: user.id,
        name: user.username,
        image: user.avatarUrl,
      });

      this.logger.log(
        `Successfully initialized messaging infrastructure for user ${user.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error initializing messaging for user ${user.id}:`,
        error.message,
      );
      // Don't throw - messaging initialization failure shouldn't block user signup
    }
  }

  async sendVerification(request: SendVerificationRequest) {
    const expireAt = await this.otpService.sendOtp(
      request.email!,
      request.verificationType,
    );
    return BaseResponse.of(VerificationCodeResponse.transformOtpData(expireAt));
  }

  async confirmVerification(request: ConfirmVerificationRequest) {
    await this.otpService.confirmOtp(
      request.email,
      request.code,
      request.verificationType,
    );

    if (request.verificationType === VerificationType.FIND_EMAIL) {
      const user = await this.prisma.user.findFirst({
        where: { email: request.email, isDeleted: false },
      });
      const response = new ConfirmVerificationResponse();
      if (user) {
        response.id = user.id;
        response.role = user.role;
        response.email = user.email;
        // Note: User model doesn't have 'name' field - it's in Fan/Idol models
        response.name = undefined;
      }

      return user ? BaseResponse.of(response) : BaseResponse.ok();
    }

    return BaseResponse.ok();
  }

  async refreshNewToken(request: RefreshTokenRequest) {
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

    const user = await this.prisma.user.findFirst({
      where: {
        id: refreshTokenPayload.sub,
        isActive: true,
        isDeleted: false,
      },
    });
    if (!user) throw new CustomError(ErrorCode.Unauthenticated);

    const [newAccessToken, newRefreshToken] = await this.generateTokens(user);

    const response = new SignInResponse();
    response.id = user.id;
    response.role = user.role;
    response.accessToken = newAccessToken;
    response.refreshToken = newRefreshToken;
    return BaseResponse.of(response);
  }

  async resetPassword(request: ResetPasswordRequest) {
    const { email, password } = request;
    await this.validateResetPassword(request);
    const hashedPassword = await hashPassword(password);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    return BaseResponse.ok();
  }

  async changePassword(userId: string, request: ChangePasswordRequest) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true, isDeleted: false },
    });
    if (!user) throw new CustomError(ErrorCode.AccountNotFound, userId);

    await this.validatePrevVerification(
      user.email,
      VerificationType.CHANGE_PASSWORD,
    );

    await this.validatePassword(user, request.oldPassword);

    const hashedPassword = await hashPassword(request.password);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return BaseResponse.ok();
  }

  private async validatePassword(user: UserModel, password: string) {
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) throw new CustomError(ErrorCode.InvalidEmailOrPassword);
  }

  private async generateTokens(user: UserModel) {
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(
      user,
      accessToken,
      ENVIRONMENT.JWT_SECRET,
    );

    await this.redisService.set(
      `${RedisKey.Account}${user.id}`,
      user,
      ENVIRONMENT.JWT_EXPIRED,
    );

    return [accessToken, refreshToken];
  }

  private async validateSignUp(request: SignUpRequest) {
    const { email, username } = request;

    await this.validatePrevVerification(
      email,
      VerificationType.REGISTER_ACCOUNT,
    );

    const userEmailExisted = await this.prisma.user.findFirst({
      where: { email, isActive: true, isDeleted: false },
      select: { id: true },
    });

    if (userEmailExisted) throw new CustomError(ErrorCode.ExistedEmail);

    // Check if username is already taken
    const fanUsernameExisted = await this.prisma.user.findFirst({
      where: { username, isActive: true, isDeleted: false },
      select: { id: true },
    });

    if (fanUsernameExisted) throw new CustomError(ErrorCode.ExistedUsername);
  }

  private async validatePrevVerification(
    email: string,
    type: VerificationType,
  ) {
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
  }

  private async validateResetPassword(request: ResetPasswordRequest) {
    const { email } = request;

    await this.validatePrevVerification(email, VerificationType.RESET_PASSWORD);

    const userExisted = await this.prisma.user.findFirst({
      where: {
        email,
        isActive: true,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!userExisted) throw new CustomError(ErrorCode.AccountNotFound, email);
  }
}
