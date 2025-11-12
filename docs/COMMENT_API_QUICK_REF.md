# Comment Feature - Quick API Reference

## Base URL
`/v1/comment`

## Authentication
All endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 📝 Create Comment
```http
POST /v1/comment
Content-Type: application/json

{
  "postId": "post-clx123abc",
  "content": "Great post! 🔥"
}
```

### 💬 Reply to Comment
```http
POST /v1/comment/:commentId/reply
Content-Type: application/json

{
  "content": "Thank you! 😊"
}
```

### 📋 Get Comments (for a post)
```http
GET /v1/comment/post/:postId?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### 📋 Get Replies (for a comment)
```http
GET /v1/comment/:commentId/replies?page=1&limit=10&sortOrder=asc
```

### 🔍 Get Single Comment
```http
GET /v1/comment/:commentId
```

### ✏️ Update Comment
```http
PATCH /v1/comment/:commentId
Content-Type: application/json

{
  "content": "Updated content"
}
```

### 🗑️ Delete Comment
```http
DELETE /v1/comment/:commentId
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "commentId": "comment-clx456def",
    "postId": "post-clx123abc",
    "parentCommentId": null,
    "content": "Great post! 🔥",
    "user": {
      "userId": "user-123",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatarUrl": "https://..."
    },
    "likesCount": 5,
    "repliesCount": 2,
    "createdAt": "2025-11-12T10:30:00Z",
    "updatedAt": "2025-11-12T10:30:00Z",
    "isDeleted": false
  }
}
```

### Paginated Response
```json
{
  "data": [
    { /* comment object */ },
    { /* comment object */ }
  ],
  "pageInfo": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Comment not found",
    "statusCode": 404
  }
}
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `sortBy` | string | `createdAt` | Sort field: `createdAt`, `likesCount` |
| `sortOrder` | string | `desc` | Sort order: `asc`, `desc` |

## Validation Rules

- **Content**: Required, max 1000 characters
- **PostId**: Required, must exist in Firestore
- **CommentId**: Must exist and not be deleted
- **Ownership**: Users can only edit/delete their own comments
- **Reply Depth**: Only 1 level deep (can't reply to replies)

## HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Comment/reply created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Not allowed to perform action
- `404 Not Found` - Comment/post not found

## Roles Allowed
- `FAN`
- `IDOL`
- `ADMIN`
