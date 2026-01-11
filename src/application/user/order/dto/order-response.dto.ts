import { ApiProperty } from '@nestjs/swagger';

/**
 * Order Item Response DTO
 */
export class OrderItemResponseDto {
  @ApiProperty({ example: 'prod_abc123' })
  productId: string;

  @ApiProperty({ example: 'K-Pop Album - Limited Edition' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 25000 })
  unitPrice: number;

  @ApiProperty({ example: 50000 })
  total: number;
}

/**
 * Shipping Address Response DTO
 */
export class ShippingAddressResponseDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  recipientName: string;

  @ApiProperty({ example: '0912345678' })
  phoneNumber: string;

  @ApiProperty({ example: '123 Main Street' })
  addressLine: string;

  @ApiProperty({ example: 'Ward 10' })
  ward: string;

  @ApiProperty({ example: 'District 3' })
  district: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  province: string;

  @ApiProperty({ example: '700000' })
  postalCode: string;

  @ApiProperty({ example: '123 Main Street, Ward 10, District 3, Ho Chi Minh City, 700000' })
  fullAddress: string;
}

/**
 * Order Response DTO
 *
 * Response DTO for order data.
 */
export class OrderResponseDto {
  @ApiProperty({ example: 'order_abc123' })
  id: string;

  @ApiProperty({ example: 'user_xyz789' })
  customerId: string;

  @ApiProperty({ example: 'shop_def456' })
  shopId: string;

  @ApiProperty({
    example: 'PENDING_PAYMENT',
    enum: ['PENDING_PAYMENT', 'CONFIRMED', 'PAID', 'SHIPPING', 'DELIVERED', 'CANCELED', 'EXPIRED'],
  })
  status: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ type: ShippingAddressResponseDto })
  shippingAddress: ShippingAddressResponseDto;

  @ApiProperty({ example: 'CREDIT', enum: ['CREDIT', 'COD'] })
  paymentMethod: string;

  @ApiProperty({ example: 'payment_123456', nullable: true })
  paymentId: string | null;

  @ApiProperty({ example: 1737500000, description: 'PayOS orderCode for webhook lookup', nullable: true })
  paymentOrderCode: number | null;

  @ApiProperty({ example: 'https://pay.payos.vn/web/abc123', description: 'PayOS checkout URL', nullable: true })
  checkoutUrl: string | null;

  @ApiProperty({ example: 'data:image/png;base64,iVBOR...', description: 'PayOS QR code (base64)', nullable: true })
  qrCode: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Payment completion timestamp', nullable: true })
  paidAt: Date | null;

  @ApiProperty({ example: 'TRACK12345', nullable: true })
  trackingNumber: string | null;

  @ApiProperty({ example: 'Customer changed mind', nullable: true })
  cancelReason: string | null;

  @ApiProperty({ example: 75000 })
  totalAmount: number;

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  updatedAt: Date;
}
