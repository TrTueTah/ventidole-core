# Comment & Reply API - Quick Reference

## 🏗️ Architecture

```
Posts
  ↓ has many
Comments (stored in 'comments' collection)
  ↓ has many
Replies (stored in 'replies' collection)
```

## 📍 Comment Endpoints

### Create Comment
```http
POST /v1/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": "post-123",
  "content": "Great post!"
}
```

### Get Comments for Post
```http
GET /v1/comment/post/:postId?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

### Get Single Comment
```http
GET /v1/comment/:commentId
```

### Update Comment
```http
PATCH /v1/comment/:commentId
{
  "content": "Updated content"
}
```

### Delete Comment
```http
DELETE /v1/comment/:commentId
```

## 💬 Reply Endpoints

### Create Reply
```http
POST /v1/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "commentId": "comment-456",
  "content": "Thanks!"
}
```

### Get Replies for Comment
```http
GET /v1/reply/comment/:commentId?page=1&limit=20&sortBy=createdAt&sortOrder=asc
```

### Get Single Reply
```http
GET /v1/reply/:replyId
```

### Update Reply
```http
PATCH /v1/reply/:replyId
{
  "content": "Updated reply"
}
```

### Delete Reply
```http
DELETE /v1/reply/:replyId
```

## 📊 Data Structure

### Comment
```json
{
  "commentId": "comment-123",
  "postId": "post-456",
  "content": "Great post!",
  "user": {
    "userId": "user-789",
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
```

### Reply
```json
{
  "replyId": "reply-123",
  "commentId": "comment-456",
  "content": "Thanks!",
  "user": {
    "userId": "user-789",
    "username": "janedoe",
    "displayName": "Jane Doe",
    "avatarUrl": "https://..."
  },
  "likesCount": 3,
  "createdAt": "2025-11-12T10:35:00Z",
  "updatedAt": "2025-11-12T10:35:00Z",
  "isDeleted": false
}
```

## 🔄 Counter Updates

| Action | Auto-Update |
|--------|-------------|
| Create comment | `post.commentsCount++` |
| Delete comment | `post.commentsCount--` |
| Create reply | `comment.repliesCount++` |
| Delete reply | `comment.repliesCount--` |

## 🔐 Security

- ✅ All endpoints require JWT Bearer token
- ✅ Users can only edit/delete their own content
- ✅ Max content length: 1000 characters
- ✅ Soft delete (data preserved)

## 📋 Query Parameters

| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `page` | number | 1 | Any positive integer |
| `limit` | number | 20 | 1-100 |
| `sortBy` | string | `createdAt` | `createdAt`, `likesCount` |
| `sortOrder` | string | `desc` (comments), `asc` (replies) | `asc`, `desc` |

## 🎯 Use Cases

### Get all comments for a post
```
GET /v1/comment/post/{postId}
```

### Get all replies for a comment
```
GET /v1/reply/comment/{commentId}
```

### Create nested conversation
```
1. POST /v1/comment (create comment on post)
2. POST /v1/reply (create reply to comment)
3. GET /v1/reply/comment/{commentId} (view replies)
```

## 🔥 Firestore Real-time

### Listen to comments
```javascript
firestore.collection('comments')
  .where('postId', '==', postId)
  .where('isDeleted', '==', false)
  .onSnapshot(snapshot => {
    // Real-time updates
  });
```

### Listen to replies
```javascript
firestore.collection('replies')
  .where('commentId', '==', commentId)
  .where('isDeleted', '==', false)
  .onSnapshot(snapshot => {
    // Real-time updates
  });
```

## ⚠️ Important Notes

1. **Separate collections**: Comments and replies are in different Firestore collections
2. **No nested replies**: Replies are flat (can't reply to a reply)
3. **Soft delete**: Deleted items are marked `isDeleted: true`
4. **User data**: Always fetched fresh from PostgreSQL
5. **Pagination**: Use `page` and `limit` for better performance

## 🆚 Comment vs Reply

| Feature | Comment | Reply |
|---------|---------|-------|
| **Target** | Post | Comment |
| **Collection** | `comments` | `replies` |
| **Query by** | `postId` | `commentId` |
| **Has replies** | Yes | No |
| **Endpoint** | `/v1/comment` | `/v1/reply` |
| **Updates** | `post.commentsCount` | `comment.repliesCount` |

## 📱 Frontend Integration Example

```typescript
// Comment flow
const comments = await api.get(`/v1/comment/post/${postId}`);

// Reply flow
const replies = await api.get(`/v1/reply/comment/${commentId}`);

// Create comment
await api.post('/v1/comment', {
  postId: 'post-123',
  content: 'Great!'
});

// Create reply
await api.post('/v1/reply', {
  commentId: 'comment-456',
  content: 'Thanks!'
});
```
