# Comment System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                        │
│                  (Mobile App / Web Frontend)                     │
└────────────┬──────────────────────────────────────┬─────────────┘
             │                                      │
             │ HTTP REST API                        │ Real-time
             │ (JWT Auth)                           │ Subscription
             ▼                                      ▼
┌────────────────────────────┐      ┌──────────────────────────────┐
│     NestJS Backend API     │      │    Firebase Firestore        │
│   (Comment Controller)     │      │   (comments collection)      │
└────────────┬───────────────┘      └──────────────┬───────────────┘
             │                                      │
             │                                      │
             ▼                                      │
┌────────────────────────────┐                     │
│    Comment Service         │◄────────────────────┘
│  (Business Logic)          │      Read/Write Comments
└────────┬───────────────────┘
         │
         ├────────────────────┐
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│   PostgreSQL    │  │    Firestore     │
│  (User Data)    │  │  (Comment Data)  │
│                 │  │                  │
│ - User Info     │  │ - Comments       │
│ - Verification  │  │ - Replies        │
│ - Source of     │  │ - Counters       │
│   Truth         │  │ - Timestamps     │
└─────────────────┘  └──────────────────┘
```

## Data Flow

### 1. Create Comment Flow

```
Client                API               Service           Firestore        PostgreSQL
  │                    │                   │                  │                │
  │─── POST comment ──>│                   │                  │                │
  │                    │── createComment ─>│                  │                │
  │                    │                   │── verify user ──>│                │
  │                    │                   │<── user exists ──┤                │
  │                    │                   │── verify post ───>│                │
  │                    │                   │<── post exists ───┤                │
  │                    │                   │── create doc ────>│                │
  │                    │                   │── update count ──>│                │
  │                    │                   │── get user info ──>│               │
  │                    │<── response ──────┤                  │                │
  │<── 201 Created ────┤                   │                  │                │
  │                    │                   │                  │                │
```

### 2. Get Comments Flow

```
Client                API               Service           Firestore        PostgreSQL
  │                    │                   │                  │                │
  │─── GET comments ──>│                   │                  │                │
  │                    │── getComments ───>│                  │                │
  │                    │                   │── query docs ────>│                │
  │                    │                   │<── comments ──────┤                │
  │                    │                   │                  │                │
  │                    │                   │── get user info ──>│               │
  │                    │                   │   (for each)     │                │
  │                    │                   │<── user data ─────┤                │
  │                    │<── response ──────┤                  │                │
  │<── 200 OK ─────────┤                   │                  │                │
  │                    │                   │                  │                │
```

## Comment Structure

```
┌────────────────────────────────────────────────────────────┐
│                          Post                              │
│  ID: post-123                                              │
│  Content: "Check out this amazing sunset!"                 │
│  CommentsCount: 3                                          │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ has many
                         ▼
         ┌───────────────────────────────────┐
         │      Top-Level Comments           │
         └───────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
  ┌────────────┐  ┌────────────┐  ┌────────────┐
  │ Comment 1  │  │ Comment 2  │  │ Comment 3  │
  │ "Great!"   │  │ "Amazing!" │  │ "Love it!" │
  │ Replies: 2 │  │ Replies: 0 │  │ Replies: 1 │
  └──────┬─────┘  └────────────┘  └──────┬─────┘
         │                                │
         │ has many                       │ has many
         ▼                                ▼
  ┌────────────┐                   ┌────────────┐
  │  Reply 1   │                   │  Reply 1   │
  │ "Thanks!"  │                   │ "Agreed!"  │
  └────────────┘                   └────────────┘
  ┌────────────┐
  │  Reply 2   │
  │ "Indeed!"  │
  └────────────┘
```

## Collection Schema (Firestore)

### Comments Collection
```javascript
comments/{commentId}
{
  userId: "user-123",              // Reference to user
  postId: "post-456",              // Reference to post
  parentCommentId: null,           // null for top-level, commentId for replies
  content: "Great post!",          // Comment text
  likesCount: 5,                   // Number of likes
  repliesCount: 2,                 // Number of replies (only for top-level)
  createdAt: Timestamp,            // Creation time
  updatedAt: Timestamp,            // Last update time
  isDeleted: false                 // Soft delete flag
}
```

## Key Features

### ✅ Hierarchical Comments
- Top-level comments on posts
- Replies to comments (1 level only)
- No nested reply chains

### ✅ Auto-Counter Updates
```
Create Comment → Increment Post.commentsCount
Create Reply   → Increment Comment.repliesCount
Delete Comment → Decrement Post.commentsCount
Delete Reply   → Decrement Comment.repliesCount
```

### ✅ Real-time Capabilities
```
Firestore provides:
- Real-time updates
- Offline support
- Automatic sync
- Collection queries
```

### ✅ Security
```
✓ JWT Authentication required
✓ User verification from PostgreSQL
✓ Ownership checks for edit/delete
✓ Input validation (max 1000 chars)
✓ Soft delete (preserves threads)
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/comment` | Create comment |
| POST | `/v1/comment/:id/reply` | Create reply |
| GET | `/v1/comment/post/:postId` | Get comments |
| GET | `/v1/comment/:id/replies` | Get replies |
| GET | `/v1/comment/:id` | Get comment |
| PATCH | `/v1/comment/:id` | Update comment |
| DELETE | `/v1/comment/:id` | Delete comment |
