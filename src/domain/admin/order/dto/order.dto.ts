import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from 'src/db/prisma/enums';

export class OrderUserDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'User ID' })
  id: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username',
  })
  username: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email',
  })
  email: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
  })
  avatarUrl?: string | null;
}

export class OrderItemDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Order Item ID' })
  id: string;

  @ApiProperty({ example: 'clxxxxxxx', description: 'Product ID' })
  productId: string;

  @ApiProperty({
    example: 'Official T-Shirt',
    description: 'Product name',
  })
  productName: string;

  @ApiPropertyOptional({ example: 'clxxxxxxx', description: 'Variant ID' })
  variantId?: string | null;

  @ApiPropertyOptional({
    example: 'Size L',
    description: 'Variant name',
  })
  variantName?: string | null;

  @ApiProperty({
    example: 29.99,
    description: 'Price',
  })
  price: number;

  @ApiProperty({
    example: 2,
    description: 'Quantity',
  })
  quantity: number;
}

export class OrderDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Order ID' })
  id: string;

  @ApiProperty({
    description: 'User information',
    type: () => OrderUserDto,
  })
  user: OrderUserDto;

  @ApiProperty({
    example: 59.98,
    description: 'Total amount',
  })
  totalAmount: number;

  @ApiProperty({
    example: 'pending',
    description: 'Order status',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @ApiProperty({
    example: 'credit_card',
    description: 'Payment method',
  })
  paymentMethod: string;

  @ApiPropertyOptional({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Paid at',
  })
  paidAt?: Date | null;

  @ApiProperty({
    example: 2,
    description: 'Number of items',
  })
  itemCount: number;

  @ApiProperty({
    example: true,
    description: 'Whether the order is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Created at',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Updated at',
  })
  updatedAt: Date;
}
