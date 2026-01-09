# Banner Feature Documentation

## Overview

The Banner feature allows administrators to manage promotional banners that are displayed to users based on scheduled date ranges. Users can view only active banners that fall within their configured start and end dates.

## Database Schema

### Banner Table

```prisma
model Banner {
  id          String    @id @default(cuid())
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  version     Int       @default(0)
  isDeleted   Boolean   @default(false) @map("is_deleted")
  deletedAt   DateTime? @map("deleted_at")
  metadata    Json?
  title       String    @db.VarChar(255)
  description String?   @db.Text
  imageUrl    String    @map("image_url") @db.VarChar(500)
  link        String?   @db.VarChar(500)
  startDate   DateTime  @map("start_date")
  endDate     DateTime  @map("end_date")
  order       Int       @default(0)

  @@index([startDate, endDate])
  @@index([order])
  @@map("banner")
}
```

**Fields:**
- `id` - Unique identifier
- `title` - Banner title (max 255 characters)
- `description` - Optional detailed description
- `imageUrl` - Banner image URL (max 500 characters)
- `link` - Optional click-through URL (max 500 characters)
- `startDate` - When banner becomes active
- `endDate` - When banner expires
- `order` - Display order (lower numbers show first)
- `isActive` - Manual active/inactive toggle
- Includes standard soft-delete and audit fields

## API Endpoints

### Admin Endpoints

Base path: `/v1/admin/banner`

#### 1. Get All Banners
```
GET /v1/admin/banner
```

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 10)
- `search` (string, optional) - Search in title and description
- `isActive` (boolean, optional) - Filter by active status

**Response:**
```json
{
  "data": [
    {
      "id": "banner_id",
      "title": "Summer Sale",
      "description": "Get 50% off on all items",
      "imageUrl": "https://example.com/banner.jpg",
      "link": "https://example.com/sale",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T23:59:59.000Z",
      "order": 1,
      "isActive": true,
      "createdAt": "2026-01-08T00:00:00.000Z",
      "updatedAt": "2026-01-08T00:00:00.000Z"
    }
  ],
  "pageInfo": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

#### 2. Get Banner by ID
```
GET /v1/admin/banner/:id
```

**Response:**
```json
{
  "data": {
    "id": "banner_id",
    "title": "Summer Sale",
    "description": "Get 50% off on all items",
    "imageUrl": "https://example.com/banner.jpg",
    "link": "https://example.com/sale",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-31T23:59:59.000Z",
    "order": 1,
    "isActive": true,
    "version": 0,
    "isDeleted": false,
    "deletedAt": null,
    "metadata": null,
    "createdAt": "2026-01-08T00:00:00.000Z",
    "updatedAt": "2026-01-08T00:00:00.000Z"
  }
}
```

#### 3. Create Banner
```
POST /v1/admin/banner
```

**Request Body:**
```json
{
  "title": "Summer Sale",
  "description": "Get 50% off on all items",
  "imageUrl": "https://example.com/banner.jpg",
  "link": "https://example.com/sale",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-31T23:59:59.000Z",
  "order": 1
}
```

**Validation:**
- `title` - Required, max 255 characters
- `description` - Optional string
- `imageUrl` - Required, valid URL, max 500 characters
- `link` - Optional, valid URL, max 500 characters
- `startDate` - Required, valid ISO date string
- `endDate` - Required, valid ISO date string
- `order` - Optional integer (default: 0)
- `startDate` must be before `endDate`

**Response:**
```json
{
  "data": {
    "id": "banner_id",
    "title": "Summer Sale",
    // ... full banner details
  }
}
```

#### 4. Update Banner
```
PATCH /v1/admin/banner/:id
```

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "imageUrl": "https://example.com/new-banner.jpg",
  "link": "https://example.com/new-link",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-01-31T23:59:59.000Z",
  "order": 2,
  "isActive": false
}
```

**Validation:**
- Same as create, but all fields are optional
- Date validation still applies if dates are provided

**Response:**
```json
{
  "data": {
    "id": "banner_id",
    // ... updated banner details
  }
}
```

#### 5. Delete Banner
```
DELETE /v1/admin/banner/:id
```

**Note:** Performs soft delete (sets `isDeleted: true`, `deletedAt: timestamp`)

**Response:**
```json
{
  "data": null
}
```

### User Endpoints

Base path: `/v1/user/banner`

#### Get Active Banners
```
GET /v1/user/banner/active
```

Returns only banners that meet ALL criteria:
- `isDeleted: false`
- `isActive: true`
- Current date/time is between `startDate` and `endDate`

Results are ordered by:
1. `order` field (ascending)
2. `createdAt` (descending)

**Response:**
```json
{
  "data": [
    {
      "id": "banner_id",
      "title": "Summer Sale",
      "description": "Get 50% off on all items",
      "imageUrl": "https://example.com/banner.jpg",
      "link": "https://example.com/sale",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T23:59:59.000Z",
      "order": 1
    }
  ]
}
```

## File Structure

```
src/domain/
├── admin/
│   ├── banner/
│   │   ├── dto/
│   │   │   ├── banner.dto.ts
│   │   │   ├── banner-detail.dto.ts
│   │   │   ├── create-banner.dto.ts
│   │   │   ├── update-banner.dto.ts
│   │   │   └── get-banners.dto.ts
│   │   ├── admin-banner.controller.ts
│   │   ├── admin-banner.service.ts
│   │   └── admin-banner.module.ts
│   └── admin.module.ts (imports AdminBannerModule)
└── user/
    ├── banner/
    │   ├── dto/
    │   │   └── banner.dto.ts
    │   ├── banner.controller.ts
    │   ├── banner.service.ts
    │   └── banner.module.ts
    └── user.module.ts (imports BannerModule)
```

## Business Logic

### Admin Service

**`getAllBanners()`**
- Supports pagination
- Filters by search term (title or description)
- Filters by active status
- Excludes soft-deleted banners
- Orders by `order` ASC, then `createdAt` DESC

**`getBannerById()`**
- Returns full banner details
- Throws NOT_FOUND if banner doesn't exist

**`createBanner()`**
- Validates that `startDate < endDate`
- Sets default `order: 0` if not provided
- Returns created banner

**`updateBanner()`**
- Partial updates
- Validates dates if provided
- Checks banner exists before updating
- Returns updated banner

**`deleteBanner()`**
- Soft delete only
- Sets `isDeleted: true` and `deletedAt: timestamp`
- Checks banner exists before deleting

### User Service

**`getActiveBanners()`**
- Returns only active, non-deleted banners
- Filters by current date between `startDate` and `endDate`
- Orders by `order` ASC, then `createdAt` DESC
- Returns minimal fields needed for display

## Usage Examples

### Admin: Create a Scheduled Banner
```bash
curl -X POST https://api.example.com/v1/admin/banner \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Holiday Sale",
    "description": "Special discounts for the holidays",
    "imageUrl": "https://cdn.example.com/holiday-banner.jpg",
    "link": "https://shop.example.com/holiday",
    "startDate": "2026-12-20T00:00:00.000Z",
    "endDate": "2026-12-31T23:59:59.000Z",
    "order": 1
  }'
```

### Admin: Update Banner Status
```bash
curl -X PATCH https://api.example.com/v1/admin/banner/banner_id \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### User: Get Active Banners
```bash
curl -X GET https://api.example.com/v1/user/banner/active \
  -H "Authorization: Bearer <token>"
```

## Notes

- All endpoints require authentication (Bearer token)
- Admin endpoints require ADMIN role
- Dates are stored in UTC
- Banner images should be hosted externally (CDN recommended)
- The `order` field allows manual control of banner display sequence
- Banners are automatically filtered by date range on the user endpoint
- Soft delete ensures historical data preservation

## Migration

Run the following command to apply the database schema:

```bash
npx prisma migrate dev --name add_banner_table
```

Or if using push for development:

```bash
npx prisma db push
```
