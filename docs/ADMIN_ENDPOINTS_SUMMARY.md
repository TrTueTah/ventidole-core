# Admin API Endpoints Summary

This document provides a comprehensive overview of all admin endpoints available in the Ventidole Core API.

## Base URL

All admin endpoints are prefixed with `/v1/admin/` and require Bearer authentication.

---

## 1. User Management

**Base Path:** `/v1/admin/user`

| Method | Endpoint             | Description                               |
| ------ | -------------------- | ----------------------------------------- |
| GET    | `/v1/admin/user`     | Get all users with pagination and filters |
| GET    | `/v1/admin/user/:id` | Get user details by ID                    |
| POST   | `/v1/admin/user`     | Create a new user                         |
| PATCH  | `/v1/admin/user/:id` | Update user information                   |
| DELETE | `/v1/admin/user/:id` | Delete a user (soft delete)               |

### Query Parameters (GET /v1/admin/user)

- `search` - Search by name, email, or username
- `isActive` - Filter by active status (`true`/`false`)
- `role` - Filter by user role
- `sortBy` - Sort field (createdAt, updatedAt, etc.)
- `sortOrder` - Sort order (`asc`/`desc`)
- `page` - Page number
- `limit` - Items per page

---

## 2. Community Management

**Base Path:** `/v1/admin/community`

| Method | Endpoint                  | Description                                     |
| ------ | ------------------------- | ----------------------------------------------- |
| GET    | `/v1/admin/community`     | Get all communities with pagination and filters |
| GET    | `/v1/admin/community/:id` | Get community details by ID                     |
| POST   | `/v1/admin/community`     | Create a new community                          |
| PATCH  | `/v1/admin/community/:id` | Update community information                    |
| DELETE | `/v1/admin/community/:id` | Delete a community (soft delete)                |

### Query Parameters (GET /v1/admin/community)

- `search` - Search by community name or description
- `isActive` - Filter by active status (`true`/`false`)
- `sortBy` - Sort field (createdAt, updatedAt, name)
- `sortOrder` - Sort order (`asc`/`desc`)
- `page` - Page number
- `limit` - Items per page

---

## 3. Shop Management

**Base Path:** `/v1/admin/shop`

| Method | Endpoint             | Description                               |
| ------ | -------------------- | ----------------------------------------- |
| GET    | `/v1/admin/shop`     | Get all shops with pagination and filters |
| GET    | `/v1/admin/shop/:id` | Get shop details by ID                    |
| POST   | `/v1/admin/shop`     | Create a new shop                         |
| PATCH  | `/v1/admin/shop/:id` | Update shop information                   |
| DELETE | `/v1/admin/shop/:id` | Delete a shop (soft delete)               |

### Query Parameters (GET /v1/admin/shop)

- `search` - Search by shop name or description
- `isActive` - Filter by active status (`true`/`false`)
- `ownerId` - Filter by shop owner ID
- `sortBy` - Sort field (createdAt, updatedAt, name)
- `sortOrder` - Sort order (`asc`/`desc`)
- `page` - Page number
- `limit` - Items per page

---

## 4. Product Management

**Base Path:** `/v1/admin/product`

| Method | Endpoint                | Description                                  |
| ------ | ----------------------- | -------------------------------------------- |
| GET    | `/v1/admin/product`     | Get all products with pagination and filters |
| GET    | `/v1/admin/product/:id` | Get product details by ID                    |
| POST   | `/v1/admin/product`     | Create a new product                         |
| PATCH  | `/v1/admin/product/:id` | Update product information                   |
| DELETE | `/v1/admin/product/:id` | Delete a product (soft delete)               |

### Query Parameters (GET /v1/admin/product)

- `search` - Search by product name or description
- `isActive` - Filter by active status (`true`/`false`)
- `shopId` - Filter by shop ID
- `productTypeId` - Filter by product type ID
- `sortBy` - Sort field (createdAt, updatedAt, name, price)
- `sortOrder` - Sort order (`asc`/`desc`)
- `page` - Page number
- `limit` - Items per page

---

## 5. Order Management

**Base Path:** `/v1/admin/order`

| Method | Endpoint                     | Description                                |
| ------ | ---------------------------- | ------------------------------------------ |
| GET    | `/v1/admin/order`            | Get all orders with pagination and filters |
| GET    | `/v1/admin/order/:id`        | Get order details by ID                    |
| POST   | `/v1/admin/order`            | Create a new order                         |
| PATCH  | `/v1/admin/order/:id`        | Update order information                   |
| PATCH  | `/v1/admin/order/:id/status` | Change order status                        |
| DELETE | `/v1/admin/order/:id`        | Delete an order (soft delete)              |

### Query Parameters (GET /v1/admin/order)

- `search` - Search by order number or details
- `status` - Filter by order status
- `userId` - Filter by user/customer ID
- `shopId` - Filter by shop ID
- `sortBy` - Sort field (createdAt, updatedAt, totalAmount)
- `sortOrder` - Sort order (`asc`/`desc`)
- `page` - Page number
- `limit` - Items per page

### Special Endpoint: Change Order Status

**PATCH** `/v1/admin/order/:id/status`

Updates the status of an order with validation and status transition rules.

---

## 6. Post Management ⭐

**Base Path:** `/v1/admin/post`

| Method | Endpoint                  | Description                                |
| ------ | ------------------------- | ------------------------------------------ |
| GET    | `/v1/admin/post`          | Get all posts with pagination and filters  |
| GET    | `/v1/admin/post/reported` | **Get reported posts with report details** |
| GET    | `/v1/admin/post/:id`      | Get post details by ID                     |
| POST   | `/v1/admin/post`          | Create a new post                          |
| PATCH  | `/v1/admin/post/:id`      | Update post information                    |
| PATCH  | `/v1/admin/post/:id/ban`  | **Ban a post (set isActive to false)**     |
| DELETE | `/v1/admin/post/:id`      | Delete a post (soft delete)                |

### Query Parameters (GET /v1/admin/post)

- `search` - Search by post content
- `isActive` - Filter by active status (`true`/`false`)
- `authorId` - Filter by author/user ID
- `communityId` - Filter by community ID
- `sortBy` - Sort field (createdAt, updatedAt, likeCount, commentCount, viewCount)
- `sortOrder` - Sort order (`asc`/`desc`)
- `page` - Page number
- `limit` - Items per page

### Special Endpoints

#### Get Reported Posts

**GET** `/v1/admin/post/reported`

Returns posts that have been reported by users, including:

- Post details (content, media, metrics)
- Report count
- List of all reports with:
  - Report reason
  - Reporter information
  - Report timestamp

**Response includes:**

```json
{
  "id": "post_id",
  "content": "Post content",
  "reportCount": 5,
  "reports": [
    {
      "id": "report_id",
      "reason": "Inappropriate content",
      "reportedBy": "user_id",
      "reporterName": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "isActive": true,
  "authorName": "Jane Smith",
  "communityName": "K-Pop Community"
}
```

#### Ban Post

**PATCH** `/v1/admin/post/:id/ban`

Quickly disable a post without deleting it. Sets `isActive` to `false`, making the post invisible to regular users while preserving the data for review.

---

## Common Features

### Authentication

All admin endpoints require Bearer token authentication:

```
Authorization: Bearer <your_token>
```

### Pagination

All list endpoints support pagination with the following parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `offset` - Alternative to page, direct offset value

**Response format:**

```json
{
  "items": [...],
  "pageInfo": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Soft Delete

All DELETE operations perform soft deletes:

- Records are not permanently removed from the database
- `isDeleted` flag is set to `true`
- `deletedAt` timestamp is recorded
- Deleted records are excluded from normal queries

### Sorting

Most list endpoints support flexible sorting:

- `sortBy` - Field name to sort by
- `sortOrder` - `asc` or `desc`

Common sortable fields:

- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- Entity-specific fields (name, price, likeCount, etc.)

### Search

Search functionality supports case-insensitive partial matching across relevant fields.

### Response Format

All responses follow a consistent structure:

**Single item:**

```json
{
  "data": { ... },
  "message": "Success"
}
```

**List with pagination:**

```json
{
  "items": [ ... ],
  "pageInfo": { ... }
}
```

**Error:**

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Module Structure

```
src/domain/admin/
├── admin.module.ts
├── user/
│   ├── admin-user.controller.ts
│   ├── admin-user.service.ts
│   ├── admin-user.module.ts
│   └── dto/
├── community/
│   ├── admin-community.controller.ts
│   ├── admin-community.service.ts
│   ├── admin-community.module.ts
│   └── dto/
├── shop/
│   ├── admin-shop.controller.ts
│   ├── admin-shop.service.ts
│   ├── admin-shop.module.ts
│   └── dto/
├── product/
│   ├── admin-product.controller.ts
│   ├── admin-product.service.ts
│   ├── admin-product.module.ts
│   └── dto/
├── order/
│   ├── admin-order.controller.ts
│   ├── admin-order.service.ts
│   ├── admin-order.module.ts
│   └── dto/
└── post/
    ├── admin-post.controller.ts
    ├── admin-post.service.ts
    ├── admin-post.module.ts
    └── dto/
        ├── admin-post.dto.ts
        ├── admin-post-detail.dto.ts
        ├── get-admin-posts.dto.ts
        ├── admin-create-post.dto.ts
        ├── admin-update-post.dto.ts
        └── reported-post.dto.ts
```

---

## API Documentation

All endpoints are documented using Swagger/OpenAPI and can be accessed at:

```
http://localhost:8080/api-docs
```

---

## Notes

- All timestamps are in ISO 8601 format
- All IDs use CUID format
- File uploads (avatars, media) are handled separately via file service
- Rate limiting may apply to certain endpoints
- Admin endpoints should be protected by role-based access control (RBAC)

---

**Last Updated:** January 8, 2026
