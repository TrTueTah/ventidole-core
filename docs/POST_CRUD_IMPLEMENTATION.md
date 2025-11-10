# Post CRUD Feature Implementation

## Overview
Complete CRUD (Create, Read, Update, Delete) implementation for the Post feature with Firebase Firestore integration and pagination support.

## Features Implemented

### 1. **Create Post** ✅
- **Endpoint**: `POST /v1/post`
- **Authentication**: Required (FAN, IDOL, ADMIN roles)
- **Features**:
  - Create posts in Firebase Firestore
  - Support for content, media URLs, hashtags, mentions, location
  - Visibility settings (PUBLIC, FOLLOWERS, PRIVATE)
  - User info denormalization for performance
  - Async notification sending for mentioned users

### 2. **Read Posts (List with Pagination)** ✅
- **Endpoint**: `GET /v1/post`
- **Authentication**: Required (FAN, IDOL, ADMIN roles)
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 20)
  - `userId` - Filter by user ID
  - `hashtag` - Filter by hashtag
  - `visibility` - Filter by visibility (PUBLIC, FOLLOWERS, PRIVATE)
  - `sortBy` - Sort by field (createdAt, likesCount, commentsCount)
  - `sortOrder` - Sort order (asc, desc)
- **Features**:
  - Paginated response with total count
  - Filtering by user, hashtag, visibility
  - Sorting by creation time or engagement metrics
  - Only shows public posts or user's own posts by default
  - Excludes deleted posts

### 3. **Read Single Post** ✅
- **Endpoint**: `GET /v1/post/:postId`
- **Authentication**: Required (FAN, IDOL, ADMIN roles)
- **Features**:
  - Get detailed post information
  - Visibility permission checks
  - Returns 404 if post is deleted or not found
  - Returns 403 if user doesn't have permission

### 4. **Update Post** ✅
- **Endpoint**: `PATCH /v1/post/:postId`
- **Authentication**: Required (FAN, IDOL, ADMIN roles)
- **Updatable Fields**:
  - content
  - mediaUrls
  - hashtags
  - mentions
  - location
  - visibility
- **Features**:
  - Ownership verification (only author can update)
  - Cannot update deleted posts
  - Partial updates supported
  - Updates timestamp automatically

### 5. **Delete Post** ✅
- **Endpoint**: `DELETE /v1/post/:postId`
- **Authentication**: Required (FAN, IDOL, ADMIN roles)
- **Features**:
  - Soft delete (marks isDeleted as true)
  - Ownership verification (author or ADMIN can delete)
  - Cannot delete already deleted posts
  - Updates timestamp automatically

## File Structure

```
src/domain/post/
├── post.controller.ts          # REST API endpoints
├── post.service.ts             # Business logic & Firebase operations
├── post.module.ts              # Module configuration
├── request/
│   ├── create-post.request.ts  # Create post DTO
│   ├── update-post.request.ts  # Update post DTO (NEW)
│   └── get-posts.request.ts    # Query posts with pagination DTO (NEW)
└── response/
    ├── create-post.response.ts # Create post response
    ├── get-post.response.ts    # Single post response (NEW)
    ├── get-posts.response.ts   # Paginated posts response (NEW)
    ├── update-post.response.ts # Update post response (NEW)
    ├── delete-post.response.ts # Delete post response (NEW)
    └── index.response.ts       # Export all responses
```

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/post` | Create new post | ✅ |
| GET | `/v1/post` | List posts with pagination | ✅ |
| GET | `/v1/post/:postId` | Get single post | ✅ |
| PATCH | `/v1/post/:postId` | Update post | ✅ |
| DELETE | `/v1/post/:postId` | Delete post (soft) | ✅ |

## Data Models

### Post Document (Firebase)
```typescript
{
  // User reference (ONLY userId - follows Single Source of Truth pattern)
  userId: string  // User info fetched on-demand from PostgreSQL
  
  // Content
  content: string
  mediaUrls: string[]
  hashtags: string[]
  mentions: string[]
  location: string | null
  visibility: 'public' | 'followers' | 'private'
  
  // Engagement
  likesCount: number
  commentsCount: number
  sharesCount: number
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  isDeleted: boolean
}
```

### Pagination Response
```typescript
{
  data: PostDto[]
  paging: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

## Response Format

All endpoints return responses wrapped in `BaseResponse`:

```json
{
  "statusCode": 200,
  "message": "OK",
  "data": { /* actual response data */ },
  "error": null
}
```

See [API_RESPONSE_PATTERN.md](./API_RESPONSE_PATTERN.md) for detailed documentation.

## Example Usage

### Create Post
```bash
POST /v1/post
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Beautiful sunset! 🌅 #nature",
  "mediaUrls": ["https://example.com/image.jpg"],
  "hashtags": ["nature", "sunset"],
  "mentions": ["user-id-1"],
  "location": "Santa Monica Beach",
  "visibility": "public"
}

# Response
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "postId": "post-abc123",
    "userId": "user-456",
    "username": "johndoe",
    "displayName": "John Doe",
    "content": "Beautiful sunset! 🌅 #nature",
    "mediaUrls": ["https://example.com/image.jpg"],
    "hashtags": ["nature", "sunset"],
    "mentions": ["user-id-1"],
    "location": "Santa Monica Beach",
    "createdAt": "2025-11-10T10:30:00Z",
    "counters": {
      "likesCount": 0,
      "commentsCount": 0,
      "sharesCount": 0
    }
  }
}
```

### Get Posts with Pagination
```bash
GET /v1/post?page=1&limit=20&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <token>

# Response
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "data": [
      {
        "postId": "post-1",
        "userId": "user-123",
        "displayName": "John Doe",
        "content": "Hello world!",
        /* ... other fields */
      }
    ],
    "paging": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

### Get Posts by User
```bash
GET /v1/post?userId=user-123&page=1&limit=10
Authorization: Bearer <token>
```

### Get Posts by Hashtag
```bash
GET /v1/post?hashtag=nature&page=1&limit=20
Authorization: Bearer <token>
```

### Update Post
```bash
PATCH /v1/post/:postId
Authorization: Bearer <token>

{
  "content": "Updated content",
  "visibility": "followers"
}
```

### Delete Post
```bash
DELETE /v1/post/:postId
Authorization: Bearer <token>
```

## Security Features

1. **Authentication**: All endpoints require JWT authentication
2. **Role-Based Access**: Limited to FAN, IDOL, and ADMIN roles
3. **Ownership Verification**: Users can only update/delete their own posts (except ADMIN)
4. **Visibility Controls**: Private posts only visible to owner
5. **Soft Delete**: Posts are marked as deleted, not removed from database

## Architecture Pattern

### Single Source of Truth (SSOT)
- **Only `userId` stored in Firestore** - No denormalized user data
- **User info fetched from PostgreSQL on-demand** - Always fresh and up-to-date
- **Parallel fetching** - When loading multiple posts, user info fetched in parallel
- **No synchronization needed** - User changes reflected immediately

**Benefits:**
- ✅ User data always current (name, avatar, email changes auto-reflected)
- ✅ No sync logic needed when user updates profile
- ✅ Single source of truth (PostgreSQL)
- ✅ Reduced data duplication
- ✅ Easier maintenance

See [POST_ARCHITECTURE_SSOT.md](./POST_ARCHITECTURE_SSOT.md) for detailed explanation.

## Performance Optimizations

1. **Single Source of Truth**: User info fetched fresh from PostgreSQL (source of truth)
2. **Parallel Fetching**: When loading multiple posts, user info fetched in parallel
3. **Selective Fields**: Only required user fields fetched from database
4. **Firebase Indexing**: Compound indexes for efficient queries
5. **Pagination**: Limits data transfer and improves response time
6. **Async Notifications**: Mention notifications sent asynchronously

## Error Handling

- **404 Not Found**: Post doesn't exist or is deleted
- **403 Forbidden**: Insufficient permissions to access/modify post
- **400 Bad Request**: Invalid data or attempting invalid operations
- **401 Unauthorized**: Missing or invalid authentication token

## Future Enhancements

- [ ] Add like/unlike functionality
- [ ] Add comment system
- [ ] Add share functionality
- [ ] Add post analytics
- [ ] Add media upload service integration
- [ ] Add real-time updates via WebSocket
- [ ] Add full-text search
- [ ] Add post scheduling
- [ ] Add post drafts

## Testing Recommendations

1. Test pagination with various page sizes
2. Test filtering combinations (user + hashtag + visibility)
3. Test permission boundaries (private posts, ownership)
4. Test edge cases (empty results, invalid IDs)
5. Test concurrent updates
6. Load test with large datasets

## Notes

- All posts stored in Firebase Firestore for real-time capabilities
- PostgreSQL used for user authentication (source of truth)
- Timestamps use Firebase server timestamp for consistency
- Soft delete preserves data for potential recovery
