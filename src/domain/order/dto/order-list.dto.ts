import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, PaymentMethod } from 'src/db/prisma/enums';

export class ShippingAddressDto {
  @ApiProperty({ description: 'Address ID' })
  id: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string;

  @ApiProperty({ description: 'Province code' })
  provinceCode: number;

  @ApiProperty({ description: 'Province name' })
  provinceName: string;

  @ApiProperty({ description: 'District code' })
  districtCode: number;

  @ApiProperty({ description: 'District name' })
  districtName: string;

  @ApiProperty({ description: 'Detail address' })
  detailAddress: string;

  @ApiProperty({ description: 'Is default address' })
  isDefaultAddress: boolean;
}

export class OrderItemListDto {
  @ApiProperty({ description: 'Order item ID' })
  id: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Variant ID', required: false })
  variantId?: string | null;

  @ApiProperty({ description: 'Variant name', required: false })
  variantName?: string | null;

  @ApiProperty({ description: 'Price at order time' })
  price: number;

  @ApiProperty({ description: 'Quantity ordered' })
  quantity: number;

  @ApiProperty({ description: 'Product media URLs', required: false })
  mediaUrls?: any;
}

export class OrderListDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order code', required: false })
  orderCode: string | null;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Number of items in order' })
  itemCount: number;

  @ApiProperty({ description: 'Order creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Payment date', required: false })
  paidAt?: Date | null;
}

export class OrderDetailDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order code', required: false })
  orderCode: string | null;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Shipping address', type: ShippingAddressDto })
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ description: 'Order items', type: [OrderItemListDto] })
  items: OrderItemListDto[];

  @ApiProperty({ description: 'Order creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Payment date', required: false })
  paidAt?: Date | null;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
