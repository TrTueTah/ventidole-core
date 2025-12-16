import { IsNotEmpty, IsNumber, IsString, IsUrl } from 'class-validator';

export class PayOSCreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  orderCode: number;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUrl()
  cancelUrl: string;

  @IsNotEmpty()
  @IsUrl()
  returnUrl: string;

  @IsNotEmpty()
  @IsString()
  signature: string;
}
