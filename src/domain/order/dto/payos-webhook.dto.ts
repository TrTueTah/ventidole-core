import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class PayOSWebhookDataDto {
  @ApiProperty({ description: 'Order code from PayOS', example: 123 })
  @IsNotEmpty()
  @IsNumber()
  orderCode: number;

  @ApiProperty({ description: 'Paid amount', example: 3000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Payment description', example: 'VQRIO123' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Account number', example: '12345678' })
  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Payment reference', example: 'TF230204212323' })
  @IsNotEmpty()
  @IsString()
  reference: string;

  @ApiProperty({
    description: 'Transaction date time',
    example: '2023-02-04 18:25:00',
  })
  @IsNotEmpty()
  @IsString()
  transactionDateTime: string;

  @ApiProperty({ description: 'Currency', example: 'VND' })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Payment link ID',
    example: '124c33293c43417ab7879e14c8d9eb18',
  })
  @IsNotEmpty()
  @IsString()
  paymentLinkId: string;

  @ApiProperty({ description: 'Response code', example: '00' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Response description', example: 'Thành công' })
  @IsNotEmpty()
  @IsString()
  desc: string;

  @ApiProperty({
    description: 'Counter account bank ID',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  counterAccountBankId?: string;

  @ApiProperty({
    description: 'Counter account bank name',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  counterAccountBankName?: string;

  @ApiProperty({
    description: 'Counter account name',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  counterAccountName?: string;

  @ApiProperty({
    description: 'Counter account number',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  counterAccountNumber?: string;

  @ApiProperty({
    description: 'Virtual account name',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  virtualAccountName?: string;

  @ApiProperty({
    description: 'Virtual account number',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  virtualAccountNumber?: string;
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

  @ApiProperty({ description: 'Success status', example: true })
  @IsNotEmpty()
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Webhook data', type: PayOSWebhookDataDto })
  @IsNotEmpty()
  data: PayOSWebhookDataDto;

  @ApiProperty({
    description: 'HMAC SHA256 signature',
    example: '8d8640d802576397a1ce45ebda7f835055768ac7ad2e0bfb77f9b8f12cca4c7f',
  })
  @IsNotEmpty()
  @IsString()
  signature: string;
}
