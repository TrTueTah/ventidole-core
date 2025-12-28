# User Shop API - Complete Reference

**Module Location**: `src/domain/user/shop/`  
**Last Updated**: December 27, 2025

## Table of Contents

- [Overview](#overview)
- [API Endpoints](#api-endpoints)
- [Data Transfer Objects](#data-transfer-objects)
- [Database Models](#database-models)
- [Business Logic](#business-logic)
- [Dependencies](#dependencies)
- [Security](#security)
- [Performance Considerations](#performance-considerations)

---

## Overview

The User Shop API provides e-commerce functionality within the Ventidole platform, enabling users to:

- Browse shops from followed communities
- Search and view products
- Manage shopping cart (add, update, remove items)
- Handle product variants and stock tracking

### Key Features

- ✅ Community-based shop discovery
- ✅ Product search with pagination
- ✅ Shopping cart with variant support
- ✅ Real-time stock validation
- ✅ Soft-delete pattern for data integrity
- ✅ JWT authentication on all endpoints

---

## API Endpoints

### 1. Get Following Shops

**Endpoint**: `GET /api/v1/user/shop/following`  
**Authentication**: Required (Bearer token)

**Description**: Retrieves shops from communities the user is following.

**Response**: `ShopListDto[]`

**Business Logic**:

1. Fetches user's followed communities (max 20, most recent first)
2. Retrieves active, non-deleted shops from these communities
3. Includes 4 latest products per shop
4. Preserves community follow order in results

**Example Response**:

```json
[
  {
    "id": "clxxx123",
    "name": "Coffee Corner",
    "description": "Artisan coffee shop",
    "avatarUrl": "https://...",
    "communityId": "clxxx456",
    "products": [
      {
        "id": "clxxx789",
        "name": "Espresso Blend",
        "description": "Dark roast",
        "price": 15.99,
        "stock": 100,
        "mediaUrls": ["https://..."],
        "createdAt": "2025-12-20T10:00:00Z"
      }
    ],
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-20T10:00:00Z"
  }
]
```

---

### 2. Get All Shops (Paginated)

**Endpoint**: `GET /api/v1/user/shop`  
**Authentication**: Required (Bearer token)

**Description**: Returns paginated list of all active shops with optional search.

**Query Parameters**:

- `search` (string, optional): Search shops by name (case-insensitive)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `offset` (number, optional): Skip items

**Response**: `PaginationResponseDto<UserShopDto>`

**Business Logic**:

- Returns only active, non-deleted shops
- Search filters by shop name (contains, case-insensitive)
- Ordered by creation date (newest first)

**Example Response**:

```json
{
  "data": [
    {
      "id": "clxxx123",
      "name": "Coffee Corner",
      "description": "Artisan coffee shop",
      "avatarUrl": "https://...",
      "communityId": "clxxx456",
      "isActive": true,
      "createdAt": "2025-12-01T10:00:00Z",
      "updatedAt": "2025-12-20T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 3. Get Shop Products (Paginated)

**Endpoint**: `GET /api/v1/user/shop/:shopId/products`  
**Authentication**: Required (Bearer token)

**Description**: Returns paginated products from a specific shop.

**Path Parameters**:

- `shopId` (string, required): Shop identifier

**Query Parameters**:

- `search` (string, optional): Search products by name (case-insensitive)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `offset` (number, optional): Skip items

**Response**: `PaginationResponseDto<UserProductDto>`

**Business Logic**:

1. Validates shop exists and is active
2. Returns only active, non-deleted products
3. Search filters by product name (contains, case-insensitive)
4. Ordered by creation date (newest first)

**Errors**:

- `404 Not Found`: Shop not found or inactive

**Example Response**:

```json
{
  "data": [
    {
      "id": "clxxx789",
      "name": "Espresso Blend",
      "description": "Dark roast coffee beans",
      "price": 15.99,
      "stock": 100,
      "mediaUrls": ["https://..."],
      "isActive": true,
      "createdAt": "2025-12-15T10:00:00Z",
      "updatedAt": "2025-12-20T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 4. Get Product Details

**Endpoint**: `GET /api/v1/user/shop/product/:productId`  
**Authentication**: Required (Bearer token)

**Description**: Retrieves comprehensive product information including shop, variants, and product type.

**Path Parameters**:

- `productId` (string, required): Product identifier

**Response**: `UserProductDetailDto`

**Business Logic**:

- Returns product with all related data:
  - Shop information (id, name, avatarUrl)
  - Product type (if assigned)
  - All active variants (ordered by creation date)
- Returns soft-deleted products (isDeleted check only)

**Errors**:

- `404 Not Found`: Product does not exist

**Example Response**:

```json
{
  "id": "clxxx789",
  "name": "Espresso Blend",
  "description": "Premium dark roast coffee beans",
  "note": "Best served hot",
  "price": 15.99,
  "stock": 100,
  "mediaUrls": ["https://image1.jpg", "https://image2.jpg"],
  "shop": {
    "id": "clxxx123",
    "name": "Coffee Corner",
    "avatarUrl": "https://..."
  },
  "type": {
    "id": "clxxx999",
    "name": "Coffee Beans"
  },
  "variants": [
    {
      "id": "clxxxv1",
      "name": "250g",
      "price": 15.99,
      "stock": 50,
      "isActive": true,
      "createdAt": "2025-12-15T10:00:00Z",
      "updatedAt": "2025-12-20T10:00:00Z"
    },
    {
      "id": "clxxxv2",
      "name": "500g",
      "price": 28.99,
      "stock": 50,
      "isActive": true,
      "createdAt": "2025-12-15T10:00:00Z",
      "updatedAt": "2025-12-20T10:00:00Z"
    }
  ],
  "isActive": true,
  "createdAt": "2025-12-15T10:00:00Z",
  "updatedAt": "2025-12-20T10:00:00Z"
}
```

---

### 5. Add/Update Cart Item

**Endpoint**: `POST /api/v1/user/shop/cart`  
**Authentication**: Required (Bearer token)

**Description**: Add items to cart or update existing item quantities.

**Request Body**: `AddToCartDto`

```json
{
  "productId": "clxxx789",
  "variantId": "clxxxv1", // optional
  "quantity": 2,
  "action": "increase" // "increase" | "decrease"
}
```

**Response**: `CartDto`

**Business Logic**:

#### Increase Action:

1. Validates product exists and is active
2. Validates variant (if provided) exists and belongs to product
3. Creates cart if user doesn't have one
4. Checks if item already exists in cart:
   - **Existing item**: Adds quantity to current quantity
   - **New item**: Creates new cart item
5. Validates total quantity doesn't exceed available stock
6. Returns updated cart

#### Decrease Action:

1. Validates product exists and is active
2. Validates variant (if provided)
3. Validates item exists in cart and belongs to user
4. Validates quantity is sufficient for decrease
5. Reduces quantity:
   - If resulting quantity > 0: Updates quantity
   - If resulting quantity = 0: Soft-deletes cart item (sets `isDeleted = true`)
6. Returns updated cart

**Stock Validation**:

- Uses variant stock if `variantId` provided
- Uses product stock if no variant
- Error if requested quantity exceeds available stock

**Errors**:

- `404 Not Found`: Product not found or inactive
- `404 Not Found`: Variant not found or doesn't belong to product
- `400 Bad Request`: Insufficient stock
- `404 Not Found`: Cart item not found (for decrease)
- `400 Bad Request`: Cannot decrease below 0

**Example Success Response**:

```json
{
  "id": "clxxxc1",
  "items": [
    {
      "id": "clxxxi1",
      "quantity": 2,
      "product": {
        "id": "clxxx789",
        "name": "Espresso Blend",
        "price": 15.99,
        "stock": 100,
        "mediaUrls": ["https://..."]
      },
      "variant": {
        "id": "clxxxv1",
        "name": "250g",
        "price": 15.99,
        "stock": 50
      },
      "isOutOfStock": false,
      "createdAt": "2025-12-27T10:00:00Z",
      "updatedAt": "2025-12-27T10:30:00Z"
    }
  ],
  "createdAt": "2025-12-27T10:00:00Z",
  "updatedAt": "2025-12-27T10:30:00Z"
}
```

---

### 6. Get User Cart

**Endpoint**: `GET /api/v1/user/shop/cart`  
**Authentication**: Required (Bearer token)

**Description**: Retrieves the user's shopping cart with all items.

**Response**: `CartDto`

**Business Logic**:

1. Creates cart if user doesn't have one (auto-initialization)
2. Returns all non-deleted cart items
3. Calculates `isOutOfStock` flag for each item:
   - Compares item quantity vs variant stock (if variant selected)
   - Compares item quantity vs product stock (if no variant)
   - Sets `true` if item quantity exceeds available stock
4. Orders items by creation date (newest first)

**Example Response**:

```json
{
  "id": "clxxxc1",
  "items": [
    {
      "id": "clxxxi1",
      "quantity": 2,
      "product": {
        "id": "clxxx789",
        "name": "Espresso Blend",
        "price": 15.99,
        "stock": 100,
        "mediaUrls": ["https://..."]
      },
      "variant": {
        "id": "clxxxv1",
        "name": "250g",
        "price": 15.99,
        "stock": 50
      },
      "isOutOfStock": false,
      "createdAt": "2025-12-27T10:00:00Z",
      "updatedAt": "2025-12-27T10:30:00Z"
    },
    {
      "id": "clxxxi2",
      "quantity": 5,
      "product": {
        "id": "clxxx888",
        "name": "Colombian Roast",
        "price": 18.99,
        "stock": 3,
        "mediaUrls": ["https://..."]
      },
      "variant": null,
      "isOutOfStock": true, // quantity (5) > stock (3)
      "createdAt": "2025-12-27T09:00:00Z",
      "updatedAt": "2025-12-27T09:00:00Z"
    }
  ],
  "createdAt": "2025-12-27T10:00:00Z",
  "updatedAt": "2025-12-27T10:30:00Z"
}
```

---

### 7. Remove Cart Item

**Endpoint**: `DELETE /api/v1/user/shop/cart/:cartItemId`  
**Authentication**: Required (Bearer token)

**Description**: Removes an item from the user's cart.

**Path Parameters**:

- `cartItemId` (string, required): Cart item identifier

**Response**: `CartDto`

**Business Logic**:

1. Validates cart item exists and belongs to user's cart
2. Soft-deletes the cart item (sets `isDeleted = true`, `deletedAt = now`)
3. Returns updated cart with remaining items

**Errors**:

- `404 Not Found`: Cart item not found or doesn't belong to user

**Example Response**:

```json
{
  "id": "clxxxc1",
  "items": [
    {
      "id": "clxxxi1",
      "quantity": 2,
      "product": { "..." },
      "variant": { "..." },
      "isOutOfStock": false,
      "createdAt": "2025-12-27T10:00:00Z",
      "updatedAt": "2025-12-27T10:30:00Z"
    }
  ],
  "createdAt": "2025-12-27T10:00:00Z",
  "updatedAt": "2025-12-27T10:30:00Z"
}
```

---

## Data Transfer Objects

### Request DTOs

#### AddToCartDto

```typescript
class AddToCartDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsEnum(['increase', 'decrease'])
  action: 'increase' | 'decrease';
}
```

#### GetShopsDto

```typescript
class GetShopsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
```

#### GetShopProductsDto

```typescript
class GetShopProductsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
```

---

### Response DTOs

#### ShopListDto

```typescript
class ShopListDto {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  communityId: string;
  products: ShopProductDto[]; // Max 4 latest products
  createdAt: Date;
  updatedAt: Date;
}
```

#### UserShopDto

```typescript
class UserShopDto {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  communityId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### UserProductDto

```typescript
class UserProductDto {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  mediaUrls?: any; // JSON array
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### ShopProductDto

```typescript
class ShopProductDto {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  mediaUrls?: any; // JSON array
  createdAt: Date;
}
```

#### UserProductDetailDto

```typescript
class UserProductDetailDto {
  id: string;
  name: string;
  description?: string | null;
  note?: string | null;
  price: number;
  stock: number;
  mediaUrls?: any; // JSON array
  shop: UserProductDetailShopDto;
  type?: UserProductDetailTypeDto | null;
  variants: UserProductVariantDto[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### UserProductDetailShopDto

```typescript
class UserProductDetailShopDto {
  id: string;
  name: string;
  avatarUrl?: string | null;
}
```

#### UserProductDetailTypeDto

```typescript
class UserProductDetailTypeDto {
  id: string;
  name: string;
}
```

#### UserProductVariantDto

```typescript
class UserProductVariantDto {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### CartDto

```typescript
class CartDto {
  id: string;
  items: CartItemDto[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### CartItemDto

```typescript
class CartItemDto {
  id: string;
  quantity: number;
  product: CartItemProductDto;
  variant?: CartItemVariantDto | null;
  isOutOfStock: boolean; // Computed field
  createdAt: Date;
  updatedAt: Date;
}
```

#### CartItemProductDto

```typescript
class CartItemProductDto {
  id: string;
  name: string;
  price: number;
  stock: number;
  mediaUrls?: any; // JSON array
}
```

#### CartItemVariantDto

```typescript
class CartItemVariantDto {
  id: string;
  name: string;
  price: number;
  stock: number;
}
```

---

## Database Models

### Shop Model

```prisma
model Shop {
  // Base fields
  id          String    @id @default(cuid())
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  version     Int       @default(0)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  metadata    Json?

  // Shop fields
  communityId String
  name        String    @db.VarChar(255)
  description String?   @db.Text
  avatarUrl   String?   @db.VarChar(255)
  userId      String?

  // Relations
  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  products    Product[]
  User        User?     @relation(fields: [userId], references: [id])

  @@map("shops")
}
```

### Product Model

```prisma
model Product {
  // Base fields
  id          String    @id @default(cuid())
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  version     Int       @default(0)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  metadata    Json?

  // Product fields
  shopId      String
  name        String    @db.VarChar(255)
  description String?   @db.Text
  note        String?   @db.Text
  price       Float
  stock       Int
  mediaUrls   Json?     // Array of URLs
  typeId      String?

  // Relations
  shop        Shop            @relation(fields: [shopId], references: [id], onDelete: Cascade)
  type        ProductType?    @relation(fields: [typeId], references: [id], onDelete: SetNull)
  variants    ProductVariant[]
  cartItems   CartItem[]
  orderItems  OrderItem[]

  @@map("products")
}
```

### ProductType Model

```prisma
model ProductType {
  // Base fields
  id          String    @id @default(cuid())
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  version     Int       @default(0)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  metadata    Json?

  // ProductType fields
  name        String    @db.VarChar(255)

  // Relations
  products    Product[]

  @@map("product_types")
}
```

### ProductVariant Model

```prisma
model ProductVariant {
  // Base fields
  id          String    @id @default(cuid())
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  version     Int       @default(0)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  metadata    Json?

  // Variant fields
  name        String    @db.VarChar(255)
  price       Float
  stock       Int
  productId   String

  // Relations
  product     Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  cartItems   CartItem[]
  orderItems  OrderItem[]

  @@map("product_variants")
}
```

### Cart Model

```prisma
model Cart {
  // Base fields
  id          String    @id @default(cuid())
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  version     Int       @default(0)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  metadata    Json?

  // Cart fields
  userId      String

  // Relations
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       CartItem[]

  @@map("carts")
}
```

### CartItem Model

```prisma
model CartItem {
  // Base fields
  id          String    @id @default(cuid())
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  version     Int       @default(0)
  isDeleted   Boolean   @default(false)
  deletedAt   DateTime?
  metadata    Json?

  // CartItem fields
  productId   String
  variantId   String?
  quantity    Int
  cartId      String

  // Relations
  cart        Cart            @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product     Product         @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant     ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@map("cart_items")
}
```

---

## Business Logic

### Shop Discovery Logic

#### Following-Based Discovery

1. Fetches user's community follows (CommunityFollow table)
2. Limits to 20 most recently followed communities
3. Orders by follow creation date (most recent first)
4. Retrieves shops from these communities
5. For each shop, includes 4 latest products
6. Preserves the community follow order in final result

#### Search & Browse

- Case-insensitive name search using Prisma `contains` mode
- Only active, non-deleted shops shown
- Paginated results with configurable limit
- Default ordering by creation date (newest first)

---

### Product Management Logic

#### Product Listing

- Scoped to specific shop
- Filters out inactive/deleted products
- Supports name-based search (case-insensitive)
- Pagination with total count
- Ordered by creation date (newest first)

#### Product Details

- Comprehensive view with:
  - Complete product information
  - Shop details (id, name, avatar)
  - Product type classification
  - All variants (active variants only, ordered by creation date)
- Includes soft-deleted products (for viewing purposes)

#### Variant Support

- Products can have multiple variants
- Each variant has independent:
  - Name (e.g., "250g", "500g", "Large", "Medium")
  - Price
  - Stock level
  - Active status
- Variants ordered by creation date

---

### Cart Management Logic

#### Cart Initialization

- Auto-created on first cart operation
- One cart per user (enforced by application logic)
- Cart persists across sessions

#### Add to Cart Flow (Increase Action)

```
1. Validate product exists and is active
2. If variantId provided:
   - Validate variant exists
   - Validate variant belongs to product
3. Get or create user's cart
4. Check if item already exists (same product + variant combo)
5. If exists:
   - Calculate new total quantity
   - Validate against stock (variant stock or product stock)
   - Update existing item
6. If new:
   - Validate quantity against stock
   - Create new cart item
7. Return updated cart
```

#### Update Cart Flow (Decrease Action)

```
1. Validate product exists and is active
2. If variantId provided:
   - Validate variant exists and belongs to product
3. Find existing cart item
4. Validate item exists and belongs to user's cart
5. Validate quantity >= decrease amount
6. Calculate new quantity
7. If new quantity > 0:
   - Update cart item quantity
8. If new quantity = 0:
   - Soft-delete cart item (isDeleted = true, deletedAt = now)
9. Return updated cart
```

#### Remove from Cart Flow

```
1. Find cart item by ID
2. Validate cart item exists
3. Validate cart item belongs to user's cart
4. Soft-delete cart item
5. Return updated cart (with remaining items)
```

#### Stock Validation

- **With Variant**: Uses `variant.stock`
- **Without Variant**: Uses `product.stock`
- Validation happens on increase operations
- Provides clear error messages with stock information

#### Out of Stock Detection

- Calculated dynamically on cart retrieval
- Not stored in database
- Logic:
  ```typescript
  isOutOfStock = variantId
    ? quantity > variant.stock
    : quantity > product.stock;
  ```
- Allows checkout flow to handle out-of-stock items appropriately

---

### Data Integrity Patterns

#### Soft Delete Pattern

All entities use soft delete:

- `isDeleted` boolean flag (default: false)
- `deletedAt` timestamp (nullable)
- Queries filter by `isDeleted: false`
- Preserves data for audit trails and historical records

#### Cascade Deletes

Database enforces referential integrity:

- Shop deleted → Products cascade delete
- Product deleted → Variants cascade delete
- Product deleted → Cart items cascade delete
- Cart deleted → Cart items cascade delete
- Variant deleted → Cart items set variant to null (SetNull)

#### Optimistic Locking

- `version` field tracks entity versions
- Helps prevent concurrent update conflicts
- Incremented on each update

---

## Dependencies

### Module Dependencies

- **PrismaModule**: Database ORM integration
- **PrismaService**: Injected for database operations

### Shared Utilities

- `@shared/dto/pagination-response.dto`: Standardized pagination responses
- `@shared/dto/pagination-request.dto`: Pagination query parameters
- `@shared/constant/error-code.constant`: Centralized error codes
- `@shared/constant/version.constant`: API versioning
- `@shared/helper/error`: Custom error handling utilities
- `@shared/helper/response`: Response wrapper utilities
- `@shared/interface/request.interface`: Authenticated request interface
- `@shared/service/prisma/prisma.service`: Prisma service

### Decorators

- `@core/decorator/doc.decorator`: Custom API documentation
- NestJS/Swagger decorators for OpenAPI documentation

---

## Security

### Authentication

- **All endpoints require JWT Bearer token**
- Token validated via NestJS guards
- User identity extracted from token payload

### Authorization

- Cart operations validate ownership:
  - Cart items must belong to user's cart
  - Decrease/remove operations check cart ownership
- Users can only access their own cart data

### Data Validation

- DTOs use `class-validator` decorators
- Input sanitization via NestJS pipes
- Type safety enforced at compile time

### Sensitive Data

- No password or payment information stored
- User IDs from JWT token (not user input)
- Media URLs validated before storage

### SQL Injection Prevention

- Prisma ORM with parameterized queries
- No raw SQL queries
- Type-safe database operations

---

## Performance Considerations

### Efficient Queries

#### Parallel Execution

```typescript
const [followedCommunities, shops] = await Promise.all([
  prisma.communityFollow.findMany(...),
  prisma.shop.findMany(...)
]);
```

#### Selective Field Fetching

```typescript
select: {
  id: true,
  name: true,
  avatarUrl: true,
  // Only fields needed for response
}
```

#### Pagination Optimization

```typescript
const [data, total] = await Promise.all([
  prisma.product.findMany({ skip, take }),
  prisma.product.count({ where }),
]);
```

### N+1 Prevention

- Uses Prisma `include` for related data
- Avoids separate queries for relations
- Example:
  ```typescript
  include: {
    shop: { select: { id: true, name: true, avatarUrl: true } },
    type: { select: { id: true, name: true } },
    variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' } }
  }
  ```

### Database Indexing

Recommended indexes:

- `Shop.communityId` (foreign key, auto-indexed)
- `Shop.isActive, Shop.isDeleted` (composite for filtering)
- `Product.shopId` (foreign key, auto-indexed)
- `Product.name` (for search queries)
- `CartItem.cartId` (foreign key, auto-indexed)
- `CartItem.productId, CartItem.variantId` (composite for lookups)

### Caching Opportunities

Current implementation doesn't use caching. Consider:

- **Shop listings**: Cache for 5-10 minutes
- **Product details**: Cache for 2-5 minutes
- **Product types**: Cache for 1 hour (rarely change)
- **Cart**: Not cacheable (user-specific, frequently updated)

### Query Optimization Tips

1. Use `select` to limit returned fields
2. Use `include` with nested `select` for relations
3. Avoid fetching large JSON arrays without limits
4. Use database-level ordering instead of application sorting
5. Implement cursor-based pagination for large datasets

---

## Error Handling

### Standard Error Codes

Defined in `@shared/constant/error-code.constant`:

- `PRODUCT_NOT_FOUND`: Product doesn't exist or is inactive
- `SHOP_NOT_FOUND`: Shop doesn't exist or is inactive
- `CART_ITEM_NOT_FOUND`: Cart item doesn't exist or wrong user
- `INSUFFICIENT_STOCK`: Requested quantity exceeds available stock

### Error Response Format

```json
{
  "statusCode": 404,
  "message": "Product not found or is inactive",
  "error": "Not Found",
  "errorCode": "PRODUCT_NOT_FOUND"
}
```

### Validation Errors

```json
{
  "statusCode": 400,
  "message": ["quantity must be at least 1"],
  "error": "Bad Request"
}
```

---

## Testing Recommendations

### Unit Tests

- Service methods with mocked Prisma
- DTO validation rules
- Business logic edge cases

### Integration Tests

- Full endpoint flows
- Database state changes
- Error scenarios

### Test Cases to Cover

#### Shop Endpoints

- ✅ Get following shops with no follows
- ✅ Get following shops with >20 follows
- ✅ Search shops by name (exact, partial, case-insensitive)
- ✅ Pagination edge cases (page 0, negative, beyond total)

#### Product Endpoints

- ✅ Get products from inactive shop
- ✅ Product details with/without variants
- ✅ Product details with/without product type
- ✅ Search products with special characters

#### Cart Endpoints

- ✅ Add to empty cart
- ✅ Add same item twice (quantity accumulation)
- ✅ Add item with insufficient stock
- ✅ Decrease to zero (soft delete)
- ✅ Decrease non-existent item
- ✅ Remove item from another user's cart
- ✅ Variant stock vs product stock validation
- ✅ isOutOfStock calculation accuracy

---

## Future Enhancements

### Potential Improvements

1. **Redis Caching**: Cache shop/product listings
2. **Search Optimization**: Full-text search with Algolia/Elasticsearch
3. **Inventory Reservations**: Reserve stock during checkout
4. **Wishlist Feature**: Save products for later
5. **Product Reviews**: User ratings and reviews
6. **Advanced Filtering**: Filter by price range, type, rating
7. **Product Recommendations**: AI-based suggestions
8. **Stock Notifications**: Alert when out-of-stock items available
9. **Bulk Operations**: Add multiple items at once
10. **Cart Expiration**: Auto-cleanup old carts

### Scalability Considerations

- Implement database read replicas for query distribution
- Add Redis for session/cart caching
- Consider CDN for product images
- Implement event-driven architecture for stock updates
- Add queue system for heavy operations

---

## Related Documentation

- [Database Design Guide](./DATABASE_DESIGN_GUIDE.md)
- [API Response Pattern](./API_RESPONSE_PATTERN.md)
- [Admin Products API](./ADMIN_PRODUCTS_API.md)
- [React Native Order Integration](./REACT_NATIVE_ORDER_INTEGRATION.md)

---

## Contact & Support

For questions or issues with the Shop API:

- Check existing documentation in `docs/`
- Review Prisma schema in `prisma/schema.prisma`
- Examine test files in `test/` directory
