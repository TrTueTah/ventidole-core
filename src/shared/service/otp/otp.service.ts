import { ENVIRONMENT } from "@core/config/env.config";
import { RedisService } from "../redis/redis.service";
import { VerificationProducer } from "../queue/verification/verification.producer";
import { NodeEnv } from "@shared/enum/environment.enum";
import { randomNumber } from "@shared/helper/random";
import { RedisKey } from "@shared/enum/redis-key.enum";
import { CustomError } from "@shared/helper/error";
import { ErrorCode } from "@shared/enum/error-code.enum";
import moment from "moment";
import { PrismaService } from "../prisma/prisma.service";
import { VerificationType } from "src/db/prisma/enums";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OtpService {
  private OTP_EXPIRE_TIME = ENVIRONMENT.OTP_EXPIRE_TIME;
  private OTP_LENGTH = ENVIRONMENT.OTP_LENGTH;
  private OTP_LIMIT = ENVIRONMENT.OTP_LIMIT;
  private OTP_DAY_LIMIT = ENVIRONMENT.OTP_DAY_LIMIT;
  private OTP_TESTING = '0000';

  constructor(
    private readonly redis: RedisService,
    private readonly producer: VerificationProducer,
    private prisma: PrismaService,
  ) {}

  private generateOtp() {
    return ENVIRONMENT.NODE_ENV === NodeEnv.Local
      ? this.OTP_TESTING
      : randomNumber(this.OTP_LENGTH);
  }

  private getOtpKey(email: string, type: VerificationType) {
    return `${RedisKey.Otp}${type}_${email}`;
  }

  async sendOtp(email: string, type: VerificationType) {
    let currentLimit = 0;
    const otpKey = this.getOtpKey(email, type);
    const otpLimitKey = `${RedisKey.OtpLimit}${email}`;
    console.log('redis', this.redis);
    try {
      const [lastSent, lastLimit] = await Promise.all([
        this.redis.get<string>(otpKey),
        this.redis.get<number>(otpLimitKey),
      ]);

      if (lastSent) throw new CustomError(ErrorCode.OtpAlreadyExist);
      if (lastLimit && lastLimit >= this.OTP_LIMIT)
        throw new CustomError(ErrorCode.OtpSpam);

      const otp = this.generateOtp();
      const expireAt = moment()
        .add({ seconds: this.OTP_EXPIRE_TIME })
        .valueOf();

      await Promise.all([
        this.redis.set(otpKey, otp, this.OTP_EXPIRE_TIME),
        this.redis.set(otpLimitKey, (lastLimit || 0) + 1, this.OTP_DAY_LIMIT),
      ]);

      currentLimit = (lastLimit || 0) + 1;

      await this.prisma.verification.create({
        data: {
          token: otp,
          expiresAt: new Date(expireAt),
          type,
          email,
        },
      });

      await this.producer.sendMailProducer({
        to: email,
        subject: 'Your verification code',
        context: {
          otp: otp,
          expiration: moment(expireAt).format('HH:mm DD/MM/YYYY'),
          year: moment().format('YYYY'),
        },
      });

      return expireAt;
    } catch (error) {
      // Revert cache data
      const prevLimit = currentLimit - 1;

      if (currentLimit)
        await Promise.all([
          this.redis.del(otpKey),
          prevLimit
            ? this.redis.set(otpLimitKey, prevLimit, this.OTP_DAY_LIMIT)
            : this.redis.del(otpLimitKey),
        ]);

      throw error;
    }
  }

  async confirmOtp(
    email: string,
    inputOtp: string,
    type: VerificationType,
  ) {
    try {
      const otpKey = this.getOtpKey(email, type);

      const otp = await this.redis.get(otpKey);

      if (!otp) throw new CustomError(ErrorCode.OtpExpired);
      if (otp !== inputOtp) throw new CustomError(ErrorCode.OtpIncorrect);

      await this.prisma.verification.updateMany({
        where: {
          email,
          type,
          isActive: true,
        },
        data: {
          isActive: false,
          confirmedAt: new Date(),
        },
      });
    } catch (error) {
      throw error;
    }
  }
}