# Comment & Reply Separation - Implementation Summary

## Overview
Successfully separated the comment and reply features into **two independent domains**, each with its own Firestore collection. This provides better separation of concerns and clearer API structure.

## Architecture Changes

### Before (Single Domain)
```
comments collection
├── Top-level comments (parentCommentId = null)
└── Replies (parentCommentId = commentId)
```

### After (Separated Domains)
```
comments collection (postId-based)
└── Comments on posts only

replies collection (commentId-based)
└── Replies to comments only
```

## Data Models

### Comments Collection (Firestore)
```javascript
comments/{commentId}
{
  userId: "user-123",        // Reference to user
  postId: "post-456",        // Reference to post
  content: "Great post!",    // Comment text
  likesCount: 5,             // Number of likes
  repliesCount: 2,           // Number of replies
  createdAt: Timestamp,      // Creation time
  updatedAt: Timestamp,      // Last update time
  isDeleted: false           // Soft delete flag
}
```

### Replies Collection (Firestore)
```javascript
replies/{replyId}
{
  userId: "user-123",        // Reference to user
  commentId: "comment-789",  // Reference to comment
  content: "Thank you!",     // Reply text
  likesCount: 3,             // Number of likes
  createdAt: Timestamp,      // Creation time
  updatedAt: Timestamp,      // Last update time
  isDeleted: false           // Soft delete flag
}
```

## File Structure

### Comment Domain (`src/domain/comment/`)
```
comment/
├── comment.controller.ts     # Comment API endpoints
├── comment.service.ts        # Comment business logic
├── comment.module.ts         # Comment module
├── request/
│   ├── create-comment.request.ts
│   ├── update-comment.request.ts
│   └── get-comments.request.ts
└── response/
    ├── create-comment.response.ts
    ├── update-comment.response.ts
    ├── delete-comment.response.ts
    ├── get-comment.response.ts
    ├── get-comments.response.ts
    └── index.response.ts
```

### Reply Domain (`src/domain/reply/`)
```
reply/
├── reply.controller.ts       # Reply API endpoints
├── reply.service.ts          # Reply business logic
├── reply.module.ts           # Reply module
├── request/
│   ├── create-reply.request.ts
│   ├── update-reply.request.ts
│   └── get-replies.request.ts
└── response/
    ├── create-reply.response.ts
    ├── update-reply.response.ts
    ├── delete-reply.response.ts
    ├── get-reply.response.ts
    ├── get-replies.response.ts
    └── index.response.ts
```

## API Endpoints

### Comment Endpoints (`/v1/comment`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/comment` | Create comment on post |
| GET | `/v1/comment/post/:postId` | Get comments for post |
| GET | `/v1/comment/:commentId` | Get single comment |
| PATCH | `/v1/comment/:commentId` | Update comment |
| DELETE | `/v1/comment/:commentId` | Delete comment |

### Reply Endpoints (`/v1/reply`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/reply` | Create reply to comment |
| GET | `/v1/reply/comment/:commentId` | Get replies for comment |
| GET | `/v1/reply/:replyId` | Get single reply |
| PATCH | `/v1/reply/:replyId` | Update reply |
| DELETE | `/v1/reply/:replyId` | Delete reply |

## Key Differences

### Comment Domain
- **Focused on**: Posts
- **Creates**: Comments on posts
- **Updates**: Post's `commentsCount`
- **Query**: By `postId`
- **No hierarchy**: Flat structure

### Reply Domain
- **Focused on**: Comments
- **Creates**: Replies to comments
- **Updates**: Comment's `repliesCount`
- **Query**: By `commentId`
- **No hierarchy**: Flat structure (no nested replies)

## API Usage Examples

### Create Comment on Post
```http
POST /v1/comment
Content-Type: application/json

{
  "postId": "post-123",
  "content": "Amazing post! 🎉"
}
```

### Create Reply to Comment
```http
POST /v1/reply
Content-Type: application/json

{
  "commentId": "comment-456",
  "content": "Thanks for your comment! 😊"
}
```

### Get Comments for Post
```http
GET /v1/comment/post/post-123?page=1&limit=20&sortOrder=desc
```

### Get Replies for Comment
```http
GET /v1/reply/comment/comment-456?page=1&limit=10&sortOrder=asc
```

## Benefits of Separation

### ✅ Clear Separation of Concerns
- Comments handle post-level interactions
- Replies handle comment-level interactions
- Each domain has single responsibility

### ✅ Independent Scaling
- Comment and reply collections can scale independently
- Different query patterns optimized separately
- Can apply different indexes/rules per collection

### ✅ Cleaner API
- More RESTful design
- Clearer endpoint purposes
- Easier to understand and document

### ✅ Easier to Extend
- Add features to comments without affecting replies
- Add features to replies without affecting comments
- Can introduce different data models if needed

### ✅ Better Firestore Performance
- Separate collections = better query performance
- Each collection optimized for its access pattern
- Comments queried by postId
- Replies queried by commentId

## Configuration Changes

### Firebase Collections (`src/types/collection.types.ts`)
```typescript
export interface FirebaseCollectionNames {
  posts: string;
  notifications: string;
  chatMessages: string;
  comments: string;     // ✅ For comments on posts
  replies: string;      // ✅ For replies to comments
}
```

### App Module (`src/app.module.ts`)
```typescript
imports: [
  // ... other modules
  PostModule,
  CommentModule,   // ✅ Handles comments on posts
  ReplyModule,     // ✅ Handles replies to comments
  ChatModule,
  // ... other modules
]
```

## Auto-Counter Management

### Post Counters
```
Create Comment  → Increment post.commentsCount
Delete Comment  → Decrement post.commentsCount
```

### Comment Counters
```
Create Reply    → Increment comment.repliesCount
Delete Reply    → Decrement comment.repliesCount
```

## Migration Notes

### Breaking Changes
- ❌ Removed: `POST /v1/comment/:commentId/reply` → Use `POST /v1/reply` instead
- ❌ Removed: `GET /v1/comment/:commentId/replies` → Use `GET /v1/reply/comment/:commentId` instead
- ✅ All other comment endpoints remain the same

### Client Updates Required
```javascript
// OLD: Create reply
POST /v1/comment/comment-123/reply
{ content: "Thanks!" }

// NEW: Create reply
POST /v1/reply
{ commentId: "comment-123", content: "Thanks!" }

// OLD: Get replies
GET /v1/comment/comment-123/replies

// NEW: Get replies
GET /v1/reply/comment/comment-123
```

## Real-time Subscriptions

### Subscribe to Comments (Firestore)
```javascript
firestore.collection('comments')
  .where('postId', '==', postId)
  .where('isDeleted', '==', false)
  .orderBy('createdAt', 'desc')
  .onSnapshot(snapshot => {
    // Handle comments update
  });
```

### Subscribe to Replies (Firestore)
```javascript
firestore.collection('replies')
  .where('commentId', '==', commentId)
  .where('isDeleted', '==', false)
  .orderBy('createdAt', 'asc')
  .onSnapshot(snapshot => {
    // Handle replies update
  });
```

## Testing Checklist

### Comment Domain
- [ ] Create comment on post
- [ ] Get comments for post (paginated)
- [ ] Get single comment
- [ ] Update own comment
- [ ] Delete own comment
- [ ] Verify post.commentsCount updates

### Reply Domain
- [ ] Create reply to comment
- [ ] Get replies for comment (paginated)
- [ ] Get single reply
- [ ] Update own reply
- [ ] Delete own reply
- [ ] Verify comment.repliesCount updates

### Cross-Domain
- [ ] Delete comment with replies (replies remain)
- [ ] Verify counters accuracy
- [ ] Test real-time subscriptions

## Security & Validation

Both domains share same security model:
- ✅ JWT Authentication required
- ✅ User verification from PostgreSQL
- ✅ Ownership checks for edit/delete
- ✅ Input validation (max 1000 chars)
- ✅ Soft delete (preserves data)

## Future Enhancements

### Comment Features
- Like/unlike comments
- Pin comments (post owner)
- Report comments
- Comment analytics

### Reply Features
- Like/unlike replies
- Highlight replies (comment owner)
- Report replies
- Reply analytics

## Notes

- Both domains use Firestore for storage (real-time ready)
- User data always fetched fresh from PostgreSQL
- Soft delete preserves conversation threads
- Maximum content length: 1000 characters
- All operations require authentication
