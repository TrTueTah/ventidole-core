/**
 * Order Item Response DTO
 */
export class OrderItemResponseDto {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/**
 * Shipping Address Response DTO
 */
export class ShippingAddressResponseDto {
  recipientName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  postalCode: string;
  fullAddress: string;
}

/**
 * Order Response DTO
 *
 * Response DTO for order data.
 */
export class OrderResponseDto {
  id: string;
  customerId: string;
  shopId: string;
  status: string;
  items: OrderItemResponseDto[];
  shippingAddress: ShippingAddressResponseDto;
  paymentMethod: string;
  paymentId: string | null;
  trackingNumber: string | null;
  cancelReason: string | null;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
