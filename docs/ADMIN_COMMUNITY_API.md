# Admin Community Management API

## Overview
This document provides a comprehensive reference for all Admin Community Management APIs. These endpoints allow administrators to manage communities including creating, updating, viewing, and deleting communities.

**Base URL:** `/v1/admin/community`

**Authentication:** All endpoints require Bearer token authentication (`@ApiBearerAuth`)

**API Tag:** `Admin Community Management`

---

## Table of Contents
1. [Get All Communities](#1-get-all-communities)
2. [Get Community by ID](#2-get-community-by-id)
3. [Create Community](#3-create-community)
4. [Update Community](#4-update-community)
5. [Delete Community](#5-delete-community)
6. [Data Models](#data-models)
7. [Error Codes](#error-codes)

---

## API Endpoints

### 1. Get All Communities

Retrieve a paginated list of all communities with optional filtering and sorting.

**Endpoint:** `GET /v1/admin/community`

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page | `10` |
| `search` | string | No | Search by community name or description | `K-Pop` |
| `isActive` | string | No | Filter by active status | `true` or `false` |
| `sortBy` | string | No | Sort by field: `createdAt`, `updatedAt`, `name` | `createdAt` |
| `sortOrder` | string | No | Sort order: `asc` or `desc` | `desc` |

#### Response

**Status Code:** `200 OK`

**Response Type:** `PaginationResponse<CommunityDto>`

```json
{
  "data": [
    {
      "id": "clxxxxxxx",
      "name": "K-Pop Fans Community",
      "avatarUrl": "https://example.com/avatar.jpg",
      "backgroundUrl": "https://example.com/background.jpg",
      "description": "A community for K-Pop fans",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pageInfo": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

#### Use Cases
- Display all communities in admin dashboard
- Search for specific communities by name or description
- Filter communities by active/inactive status
- Sort communities by creation date, update date, or name

---

### 2. Get Community by ID

Retrieve detailed information about a specific community including member count and post count.

**Endpoint:** `GET /v1/admin/community/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Community ID |

#### Response

**Status Code:** `200 OK`

**Response Type:** `BaseResponse<AdminCommunityDetailDto>`

```json
{
  "data": {
    "id": "clxxxxxxx",
    "name": "K-Pop Fans Community",
    "avatarUrl": "https://example.com/avatar.jpg",
    "backgroundUrl": "https://example.com/background.jpg",
    "description": "A community for K-Pop fans",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "totalMembers": 100,
    "totalPosts": 50
  }
}
```

#### Error Responses

**Status Code:** `404 Not Found`

```json
{
  "error": {
    "code": "CommunityNotFound",
    "message": "Community not found"
  }
}
```

#### Use Cases
- View detailed community information in admin panel
- Check community statistics (members, posts)
- Edit community details

---

### 3. Create Community

Create a new community.

**Endpoint:** `POST /v1/admin/community`

#### Request Body

**Content-Type:** `application/json`

```json
{
  "name": "K-Pop Fans Community",
  "avatarUrl": "https://example.com/avatar.jpg",
  "backgroundUrl": "https://example.com/background.jpg",
  "description": "A community for K-Pop fans",
  "communityType": "GROUP"
}
```

#### Request Body Parameters

| Field | Type | Required | Max Length | Description | Example |
|-------|------|----------|------------|-------------|---------|
| `name` | string | Yes | 100 | Community name | `K-Pop Fans Community` |
| `avatarUrl` | string | No | 255 | Community avatar URL | `https://example.com/avatar.jpg` |
| `backgroundUrl` | string | No | 255 | Community background URL | `https://example.com/background.jpg` |
| `description` | string | No | 500 | Community description | `A community for K-Pop fans` |
| `communityType` | enum | Yes | - | Community type (e.g., `GROUP`) | `GROUP` |

#### Response

**Status Code:** `201 Created`

**Response Type:** `BaseResponse<CommunityDto>`

```json
{
  "data": {
    "id": "clxxxxxxx",
    "name": "K-Pop Fans Community",
    "avatarUrl": "https://example.com/avatar.jpg",
    "backgroundUrl": "https://example.com/background.jpg",
    "description": "A community for K-Pop fans",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Use Cases
- Admin creates new community from admin panel
- Initialize community with basic information
- Set community type and initial configuration

---

### 4. Update Community

Update an existing community's information.

**Endpoint:** `PATCH /v1/admin/community/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Community ID |

#### Request Body

**Content-Type:** `application/json`

All fields are optional. Only include fields you want to update.

```json
{
  "name": "Updated K-Pop Community",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "backgroundUrl": "https://example.com/new-background.jpg",
  "description": "An updated community for K-Pop fans",
  "isActive": false
}
```

#### Request Body Parameters

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `name` | string | No | 100 | Community name |
| `avatarUrl` | string | No | 255 | Community avatar URL |
| `backgroundUrl` | string | No | 255 | Community background URL |
| `description` | string | No | 500 | Community description |
| `isActive` | boolean | No | - | Whether the community is active |

#### Response

**Status Code:** `200 OK`

**Response Type:** `BaseResponse<CommunityDto>`

```json
{
  "data": {
    "id": "clxxxxxxx",
    "name": "Updated K-Pop Community",
    "avatarUrl": "https://example.com/new-avatar.jpg",
    "backgroundUrl": "https://example.com/new-background.jpg",
    "description": "An updated community for K-Pop fans",
    "isActive": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

#### Error Responses

**Status Code:** `404 Not Found`

```json
{
  "error": {
    "code": "CommunityNotFound",
    "message": "Community not found"
  }
}
```

#### Use Cases
- Update community information
- Change community avatar or background
- Activate/deactivate community
- Modify community description

---

### 5. Delete Community

Soft delete a community (marks as deleted but retains data).

**Endpoint:** `DELETE /v1/admin/community/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Community ID |

#### Response

**Status Code:** `200 OK`

**Response Type:** `BaseResponse<null>`

```json
{
  "data": null,
  "message": "Success"
}
```

#### Error Responses

**Status Code:** `404 Not Found`

```json
{
  "error": {
    "code": "CommunityNotFound",
    "message": "Community not found"
  }
}
```

#### Use Cases
- Remove community from active list
- Soft delete for data retention and audit purposes
- Clean up inactive or policy-violating communities

---

## Data Models

### CommunityDto

Basic community information returned in list and detail views.

```typescript
{
  id: string;                    // Community ID
  name: string;                  // Community name
  avatarUrl?: string | null;     // Community avatar URL
  backgroundUrl?: string | null; // Community background URL
  description?: string | null;   // Community description
  isActive: boolean;             // Whether the community is active
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### AdminCommunityDetailDto

Extended community information with statistics (extends CommunityDto).

```typescript
{
  ...CommunityDto,
  totalMembers: number;  // Total members in the community
  totalPosts: number;    // Total posts in the community
}
```

### CreateCommunityDto

Data required to create a new community.

```typescript
{
  name: string;              // Required, max 100 chars
  avatarUrl?: string;        // Optional, max 255 chars
  backgroundUrl?: string;    // Optional, max 255 chars
  description?: string;      // Optional, max 500 chars
  communityType: CommunityType; // Required, enum value
}
```

### UpdateCommunityDto

Data for updating an existing community (all fields optional).

```typescript
{
  name?: string;          // Optional, max 100 chars
  avatarUrl?: string;     // Optional, max 255 chars
  backgroundUrl?: string; // Optional, max 255 chars
  description?: string;   // Optional, max 500 chars
  isActive?: boolean;     // Optional
}
```

### GetCommunitiesDto

Query parameters for filtering and paginating communities.

```typescript
{
  // Pagination (inherited from PaginationDto)
  page?: number;          // Page number
  limit?: number;         // Items per page
  offset?: number;        // Offset for pagination
  
  // Filtering
  search?: string;        // Search by name or description
  isActive?: string;      // Filter by active status ('true' or 'false')
  
  // Sorting
  sortBy?: string;        // Sort field: 'createdAt', 'updatedAt', 'name'
  sortOrder?: 'asc' | 'desc'; // Sort order
}
```

---

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `CommunityNotFound` | 404 | The requested community does not exist or has been deleted |

---

## Implementation Guide for Admin Web

### 1. Authentication Setup

All API calls require Bearer token authentication:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### 2. Fetching Communities List

```typescript
// Example: Fetch communities with pagination and filters
const fetchCommunities = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.isActive) queryParams.append('isActive', params.isActive);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  const response = await fetch(
    `${API_BASE_URL}/v1/admin/community?${queryParams}`,
    { headers }
  );
  
  return response.json();
};
```

### 3. Fetching Community Details

```typescript
const fetchCommunityDetails = async (communityId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/v1/admin/community/${communityId}`,
    { headers }
  );
  
  return response.json();
};
```

### 4. Creating a Community

```typescript
const createCommunity = async (data: {
  name: string;
  avatarUrl?: string;
  backgroundUrl?: string;
  description?: string;
  communityType: string;
}) => {
  const response = await fetch(
    `${API_BASE_URL}/v1/admin/community`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }
  );
  
  return response.json();
};
```

### 5. Updating a Community

```typescript
const updateCommunity = async (
  communityId: string,
  data: {
    name?: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    description?: string;
    isActive?: boolean;
  }
) => {
  const response = await fetch(
    `${API_BASE_URL}/v1/admin/community/${communityId}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    }
  );
  
  return response.json();
};
```

### 6. Deleting a Community

```typescript
const deleteCommunity = async (communityId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/v1/admin/community/${communityId}`,
    {
      method: 'DELETE',
      headers
    }
  );
  
  return response.json();
};
```

### 7. Error Handling

```typescript
const handleApiCall = async (apiCall: () => Promise<Response>) => {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (!response.ok) {
      // Handle error based on error code
      if (data.error?.code === 'CommunityNotFound') {
        // Show community not found message
      }
      throw new Error(data.error?.message || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## UI Component Recommendations

### Community List Page

**Features:**
- Searchable table with communities
- Filters for active/inactive status
- Sortable columns (name, created date, updated date)
- Pagination controls
- Action buttons (View, Edit, Delete)

**Table Columns:**
- Community Name (with avatar)
- Description
- Members Count (fetch from detail endpoint if needed)
- Status (Active/Inactive badge)
- Created Date
- Actions

### Community Detail Page

**Features:**
- Display all community information
- Show statistics (total members, total posts)
- Edit button to open edit modal
- Delete button with confirmation
- Activity status toggle

### Create/Edit Community Modal

**Form Fields:**
- Name (required, max 100 chars)
- Avatar URL (optional, max 255 chars) - consider file upload
- Background URL (optional, max 255 chars) - consider file upload
- Description (optional, max 500 chars, textarea)
- Community Type (required, dropdown) - only for create
- Active Status (toggle) - only for edit

**Validation:**
- Client-side validation for required fields and max lengths
- Display validation errors inline

---

## Best Practices

1. **Pagination**: Always use pagination for community lists to improve performance
2. **Search**: Implement debounced search to reduce API calls
3. **Caching**: Cache community data and invalidate on updates
4. **Optimistic Updates**: Update UI optimistically while API call is in progress
5. **Error Handling**: Provide user-friendly error messages
6. **Loading States**: Show loading indicators during API calls
7. **Confirmation Dialogs**: Always confirm before deleting a community
8. **Image Validation**: Validate image URLs or implement file upload with validation

---

## Notes

- All delete operations are soft deletes (`isDeleted: false` filter)
- Communities have `isActive` flag for enabling/disabling without deletion
- Total members count includes only active, non-deleted followers
- Total posts count includes only non-deleted posts
- Default sorting is by `createdAt` in descending order
- Search is case-insensitive and searches both name and description fields
