# Admin Product API Documentation

## Overview
This document describes the admin product management endpoints for creating and listing products.

## Endpoints

### 1. Create Product
**POST** `/v1/admin/products`

Creates a new product in the system.

#### Headers
- `Authorization: Bearer <admin_jwt_token>`

#### Request Body
```json
{
  "name": "BTS Official Light Stick",
  "description": "Official BTS light stick for concerts and fan events. High quality and long-lasting.",
  "cover_image": "https://res.cloudinary.com/bucket/bts-lightstick.jpg",
  "product_category_id": "cmi653sxy0003p5ess8map7g0",
  "variants": [
    {
      "name": "Standard Version",
      "price_money": 29.99,
      "total_supply": 100,
      "remaining_supply": 100
    },
    {
      "name": "Premium Version",
      "price_money": 35.99,
      "total_supply": 50,
      "remaining_supply": 50
    }
  ]
}
```

#### Response (201 Created)
```json
{
  "statusCode": 201,
  "message": "OK",
  "data": {
    "id": "cmi64xyz123456789",
    "name": "BTS Official Light Stick",
    "description": "Official BTS light stick for concerts and fan events. High quality and long-lasting.",
    "cover_image": "https://res.cloudinary.com/bucket/bts-lightstick.jpg",
    "category": {
      "id": "cmi64er5c0003p5wbhqi8jg6h",
      "name": "Light Sticks",
      "isActive": true,
      "createdAt": "2023-11-19T10:00:00.000Z"
    },
    "variants": [
      {
        "id": "cmi64var123456789",
        "name": "Standard Version",
        "price_money": 29.99,
        "total_supply": 100,
        "remaining_supply": 100,
        "isActive": true,
        "createdAt": "2023-11-19T10:30:00.000Z"
      },
      {
        "id": "cmi64var987654321",
        "name": "Premium Version",
        "price_money": 35.99,
        "total_supply": 50,
        "remaining_supply": 50,
        "isActive": true,
        "createdAt": "2023-11-19T10:30:00.000Z"
      }
    ],
    "createdAt": "2023-11-19T10:30:00.000Z"
  },
  "error": null,
  "errorCode": null
}
```

### 2. Get Products (Paginated)
**GET** `/v1/admin/products`

Retrieves a paginated list of products with optional filtering.

#### Headers
- `Authorization: Bearer <admin_jwt_token>`

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (createdAt|name|updatedAt, default: createdAt)
- `order` (optional): Sort order (asc|desc, default: desc)
- `category_id` (optional): Filter by category ID
- `search` (optional): Search by product name

#### Examples

##### Basic listing:
```bash
GET /v1/admin/products?page=1&limit=10
```

##### Filter by category:
```bash
GET /v1/admin/products?category_id=cmi64er5c0003p5wbhqi8jg6h&page=1&limit=5
```

##### Search products:
```bash
GET /v1/admin/products?search=BTS&page=1&limit=10
```

#### Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "data": [
      {
        "id": "cmi64xyz123456789",
        "name": "BTS Official Light Stick",
        "description": "Official BTS light stick for concerts and fan events.",
        "cover_image": "https://res.cloudinary.com/bucket/bts-lightstick.jpg",
        "category": {
          "id": "cmi64er5c0003p5wbhqi8jg6h",
          "name": "Light Sticks",
          "isActive": true,
          "createdAt": "2023-11-19T10:00:00.000Z"
        },
        "variants": [
          {
            "id": "cmi64var123456789",
            "name": "Standard Version",
            "price_money": 29.99,
            "total_supply": 100,
            "remaining_supply": 85,
            "isActive": true,
            "createdAt": "2023-11-19T10:30:00.000Z"
          }
        ],
        "isActive": true,
        "createdAt": "2023-11-19T10:30:00.000Z",
        "updatedAt": "2023-11-19T10:30:00.000Z",
        "version": 0
      }
    ],
    "paging": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  },
  "error": null,
  "errorCode": null
}
```

## Available Product Categories

After running the seed script, the following categories are available:

| Category ID | Name |
|-------------|------|
| `cmi653rgm0000p5esabor5pms` | Merchandise |
| `cmi653rw40001p5esmxsetenx` | Albums |
| `cmi653sin0002p5es50rnc1t7` | Concert Tickets |
| `cmi653sxy0003p5ess8map7g0` | Light Sticks |
| `cmi653tlc0004p5espc4xemjj` | Clothing |
| `cmi653ufy0005p5esdec869hu` | Accessories |
| `cmi653vdx0006p5esbt5xvvga` | Collectibles |
| `cmi653wgq0007p5esucwgh85v` | Digital Content |

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "error": "Validation error details",
  "errorCode": "validation_failed"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null,
  "error": "Invalid or missing authentication token",
  "errorCode": "unauthenticated"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "data": null,
  "error": "Access denied. Admin role required.",
  "errorCode": "unauthorized"
}
```

### 404 Not Found - Category Not Found
```json
{
  "statusCode": 404,
  "message": "Product category not found",
  "data": null,
  "error": "The specified product category does not exist or is not active",
  "errorCode": "ConsumerNotFound"
}
```

## Testing with cURL

### Create a product:
```bash
curl -X POST "http://localhost:8080/v1/admin/products" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BTS Official Light Stick",
    "description": "Official BTS light stick for concerts and fan events.",
    "cover_image": "https://example.com/bts-lightstick.jpg",
    "product_category_id": "cmi64er5c0003p5wbhqi8jg6h",
    "variants": [
      {
        "name": "Standard Version",
        "price_money": 29.99,
        "total_supply": 100,
        "remaining_supply": 100
      }
    ]
  }'
```

### List products:
```bash
curl -X GET "http://localhost:8080/v1/admin/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### Search products:
```bash
curl -X GET "http://localhost:8080/v1/admin/products?search=BTS&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Notes

1. **Admin Authentication Required**: All endpoints require a valid admin JWT token.
2. **Product Categories**: Must exist and be active before creating products.
3. **Product Variants Required**: At least one variant must be provided when creating a product.
4. **Variant Pricing**: All prices are stored as decimal values with 2 decimal places.
5. **Inventory Management**: `total_supply` and `remaining_supply` track stock levels.
6. **Auto-Supply Setting**: If `remaining_supply` is not provided, it defaults to `total_supply`.
7. **Pagination**: Default page size is 20 items. Maximum recommended is 100 items per page.
8. **Soft Deletes**: Products and variants use soft deletes (isActive flag).
9. **Search**: Search functionality is case-insensitive and searches in product names.