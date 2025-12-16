import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export class PaymentInfoDto {
  @ApiProperty({ description: 'Payment provider', example: 'PAYOS' })
  provider: string;

  @ApiProperty({ description: 'PayOS order code (numeric)', example: 123456 })
  orderCode: number;

  @ApiProperty({
    description: 'Payment link ID from PayOS',
    example: 'abc123xyz',
  })
  paymentLinkId: string;

  @ApiProperty({
    description: 'Checkout URL for payment',
    example: 'https://pay.payos.vn/abc123xyz',
  })
  checkoutUrl: string;

  @ApiProperty({
    description: 'QR code in base64 format',
    example: 'data:image/png;base64,...',
  })
  qrCode: string;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID', example: 'cm1order123xyz' })
  orderId: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: 'PENDING_PAYMENT',
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: 'CREDIT',
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Total amount', example: 150000 })
  totalAmount: number;

  @ApiProperty({
    description: 'Payment information (only for CREDIT)',
    type: PaymentInfoDto,
    required: false,
  })
  payment?: PaymentInfoDto;

  @ApiProperty({ description: 'Order creation timestamp' })
  createdAt: Date;
}

export class RetryPaymentResponseDto {
  @ApiProperty({ description: 'Order ID', example: 'cm1order123xyz' })
  orderId: string;

  @ApiProperty({ description: 'Payment information', type: PaymentInfoDto })
  payment: PaymentInfoDto;
}
