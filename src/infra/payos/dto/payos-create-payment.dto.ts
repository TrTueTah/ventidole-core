import { IsNotEmpty, IsNumber, IsString, IsUrl } from 'class-validator';

/**
 * PayOS Create Payment DTO
 *
 * Data structure for creating a PayOS payment request.
 */
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
