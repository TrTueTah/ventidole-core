import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PayOSWebhookDataDto {
  @ApiProperty({ description: 'Order code from PayOS', example: 123456 })
  @IsNotEmpty()
  @IsNumber()
  orderCode: number;

  @ApiProperty({ description: 'Paid amount', example: 10000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Payment status', example: 'PAID' })
  @IsNotEmpty()
  @IsString()
  status: string;
}

export class PayOSWebhookDto {
  @ApiProperty({ description: 'Response code', example: '00' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Description', example: 'success' })
  @IsNotEmpty()
  @IsString()
  desc: string;

  @ApiProperty({ description: 'Webhook data', type: PayOSWebhookDataDto })
  @IsNotEmpty()
  data: PayOSWebhookDataDto;

  @ApiProperty({ description: 'HMAC SHA256 signature', example: 'abc123...' })
  @IsNotEmpty()
  @IsString()
  signature: string;
}
