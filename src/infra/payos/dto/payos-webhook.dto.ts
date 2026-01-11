import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

/**
 * PayOS Webhook DTO
 *
 * Webhook payload structure from PayOS.
 * Used for payment confirmation.
 */
export class PayOSWebhookDto {
  @IsNotEmpty()
  @IsString()
  code: string; // "00" indicates success

  @IsNotEmpty()
  @IsString()
  desc: string;

  @IsNotEmpty()
  data: {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId: string | null;
    counterAccountBankName: string | null;
    counterAccountName: string | null;
    counterAccountNumber: string | null;
    virtualAccountName: string | null;
    virtualAccountNumber: string | null;
  };

  @IsNotEmpty()
  @IsString()
  signature: string;
}

/**
 * Payment status from PayOS
 */
export enum PayOSPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}
