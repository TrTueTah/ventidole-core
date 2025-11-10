import { ApiProperty } from "@nestjs/swagger";

export class VerificationCodeResponse {
  @ApiProperty({
    description: 'Wait time in seconds',
    example: 60,
    type: Number
  })
  waitSeconds: number;

  @ApiProperty({
    description: 'Expired at verification timestamp',
    example: 1740412406898,
    type: Number
  })
  expireAt: number;

  static transformData(waitSeconds: number): Partial<VerificationCodeResponse> {
    return {
      waitSeconds,
    };
  }

  static transformOtpData(expireAt: number): Partial<VerificationCodeResponse> {
    return {
      waitSeconds: 60,
      expireAt,
    };
  }
}
