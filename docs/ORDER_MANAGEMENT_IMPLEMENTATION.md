# Order Management Implementation Summary

## Changes Made

### 1. New DTOs Created

#### `src/domain/order/dto/order-list.dto.ts`

- **OrderItemListDto**: DTO for order items in list view
- **OrderListDto**: DTO for order list (summary view)
- **OrderDetailDto**: DTO for detailed order view with all items

#### `src/domain/order/dto/get-orders.dto.ts`

- **GetOrdersDto**: Query parameters for filtering orders (extends PaginationDto)
  - Supports status filtering
  - Supports pagination

### 2. Order Service Updates (`src/domain/order/order.service.ts`)

#### New Methods:

- **`getUserOrders(userId, dto)`**: Get paginated list of user's orders with optional status filter
- **`getOrderDetails(userId, orderId)`**: Get detailed order information including items
- **`clearCartItems(userId, productIds)`**: Soft-delete cart items after order creation
- **`generateOrderCode()`**: Generate unique order codes (format: ORD-YYYYMMDD-XXXXX)

#### Updated Methods:

- **`confirmOrder()`**: Now generates orderCode and clears cart items after order creation

### 3. Order Controller Updates (`src/domain/order/order.controller.ts`)

#### New Endpoints:

- **GET `/api/v1/orders`**: Get user's orders (paginated)
  - Query params: `page`, `limit`, `offset`, `status`
  - Returns: `PaginationResponseDto<OrderListDto>`

- **GET `/api/v1/orders/:orderId/details`**: Get order details
  - Returns: `OrderDetailDto` with full order information and items

### 4. Database Schema Updates (`prisma/schema.prisma`)

#### Order Model:

- Added `orderCode` field: `String? @unique @map("order_code") @db.VarChar(50)`
- Added index on `orderCode` for faster lookups

## Features Implemented

### ✅ Cart Clearing

When an order is created, all cart items for the ordered products are automatically soft-deleted:

- Finds user's cart
- Updates `isDeleted = true` and sets `deletedAt` for matching cart items
- Logs the operation for audit trail

### ✅ Order Code Generation

Each order gets a unique human-readable code:

- Format: `ORD-20251227-12345`
- Timestamp-based (YYYYMMDD) + random 5-digit number
- Unique constraint in database

### ✅ Order Listing API

Users can fetch their orders with pagination and filtering:

- Filter by status (PENDING_PAYMENT, PAID, CONFIRMED, etc.)
- Paginated results (configurable limit)
- Ordered by creation date (newest first)
- Returns item count per order

### ✅ Order Details API

Full order information including:

- All order items with product details
- Product and variant names
- Product media URLs
- Shipping address
- Payment status and timestamps

## Database Schema Changes

You need to push the schema changes to your database:

```bash
# Push schema changes to database (no migration files)
npx prisma db push

# Generate updated Prisma client
npx prisma generate
```

This will:

- Add `orderCode` column to `order` table
- Add unique constraint on `orderCode`
- Add index on `orderCode`

## API Usage Examples

### Get User Orders

```bash
GET /api/v1/orders?page=1&limit=10&status=PAID
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "data": [
      {
        "id": "clxxx123",
        "orderCode": "ORD-20251227-12345",
        "totalAmount": 150000,
        "status": "PAID",
        "paymentMethod": "CREDIT",
        "itemCount": 3,
        "createdAt": "2025-12-27T10:00:00Z",
        "paidAt": "2025-12-27T10:05:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

### Get Order Details

```bash
GET /api/v1/orders/clxxx123/details
Authorization: Bearer <token>
```

Response:

```json
{
  "data": {
    "id": "clxxx123",
    "orderCode": "ORD-20251227-12345",
    "totalAmount": 150000,
    "status": "PAID",
    "paymentMethod": "CREDIT",
    "shippingAddress": {
      "id": "address123"
    },
    "items": [
      {
        "id": "item1",
        "productId": "prod123",
        "productName": "Espresso Blend",
        "variantId": "var123",
        "variantName": "250g",
        "price": 50000,
        "quantity": 2,
        "mediaUrls": ["https://..."]
      }
    ],
    "createdAt": "2025-12-27T10:00:00Z",
    "paidAt": "2025-12-27T10:05:00Z",
    "updatedAt": "2025-12-27T10:05:00Z"
  }
}
```

### Confirm Order (Updated)

```bash
POST /api/v1/orders/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {"productId": "xxx", "quantity": 2},
    {"productId": "yyy", "variantId": "zzz", "quantity": 1}
  ],
  "paymentMethod": "CREDIT",
  "shippingAddressId": "address123"
}
```

Response now includes orderCode:

```json
{
  "data": {
    "orderId": "clxxx123",
    "orderCode": "ORD-20251227-12345",
    "status": "PENDING_PAYMENT",
    "paymentMethod": "CREDIT",
    "totalAmount": 150000,
    "payment": {
      "provider": "PAYOS",
      "orderCode": 123456789,
      "checkoutUrl": "https://...",
      "qrCode": "data:image/png;base64,..."
    },
    "createdAt": "2025-12-27T10:00:00Z"
  }
}
```

After order creation, cart items for those products are automatically cleared.

## Files Created/Modified

### Created:

1. `/src/domain/order/dto/order-list.dto.ts`
2. `/src/domain/order/dto/get-orders.dto.ts`

### Modified:

1. `/src/domain/order/order.service.ts`
2. `/src/domain/order/order.controller.ts`
3. `/prisma/schema.prisma`

## Next Steps

Run these commands to apply the database changes:

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Restart your development server
npm run start:dev
```

## Testing Checklist

- [ ] Create an order and verify cart items are cleared
- [ ] Test GET /orders endpoint with pagination
- [ ] Test GET /orders with status filter
- [ ] Test GET /orders/:id/details endpoint
- [ ] Verify orderCode is generated and unique
- [ ] Test with multiple items in cart
- [ ] Test with variants in cart items
- [ ] Verify order details show correct product names and media

---

**Implementation Date**: December 27, 2025
