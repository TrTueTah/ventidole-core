import { Module } from "@nestjs/common";
import { QueueVerificationModule } from "../queue/verification/verification.module";
import { OtpService } from "./otp.service";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [QueueVerificationModule, RedisModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
