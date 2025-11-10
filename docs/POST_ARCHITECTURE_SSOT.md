# Post Architecture: Single Source of Truth Pattern

## Overview

The Post feature has been refactored to follow the **Single Source of Truth (SSOT)** principle, ensuring user data consistency and eliminating synchronization issues.

## Architecture Decision

### ❌ Previous Approach (Denormalized Data)
```typescript
// Firestore Post Document
{
  userId: "user-123",
  displayName: "John Doe",      // ⚠️ Denormalized - can become stale
  userEmail: "john@example.com", // ⚠️ Denormalized - can become stale
  userAvatar: "https://...",     // ⚠️ Denormalized - can become stale
  content: "Hello world",
  // ... other fields
}
```

**Problems:**
- 🔴 User changes name → All posts show old name
- 🔴 User changes avatar → All posts show old avatar
- 🔴 User changes email → All posts show old email
- 🔴 Requires complex sync logic to update all posts when user info changes
- 🔴 Data inconsistency across the system
- 🔴 Increased storage usage

### ✅ New Approach (Single Source of Truth)
```typescript
// Firestore Post Document
{
  userId: "user-123",  // ✅ Only store reference
  content: "Hello world",
  // ... other fields
}

// User info fetched from PostgreSQL when needed
```

**Benefits:**
- ✅ User data always fresh and up-to-date
- ✅ No synchronization needed
- ✅ Single source of truth (PostgreSQL)
- ✅ Reduced storage in Firestore
- ✅ Easier maintenance
- ✅ Data consistency guaranteed

## Implementation Details

### 1. Post Creation (Simplified)

```typescript
// Only store userId, no denormalized data
const postData = {
  userId: request.user.id,  // Reference only
  content: body.content,
  mediaUrls: body.mediaUrls || [],
  hashtags: body.hashtags || [],
  mentions: body.mentions || [],
  location: body.location || null,
  visibility: body.visibility || PostVisibility.PUBLIC,
  likesCount: 0,
  commentsCount: 0,
  sharesCount: 0,
  createdAt: now,
  updatedAt: now,
  isDeleted: false,
};
```

### 2. User Info Fetching (On-Demand)

```typescript
/**
 * Get user display information from PostgreSQL (single source of truth)
 * This ensures user data is always fresh and up-to-date
 */
private async getUserInfo(userId: string): Promise<{
  username: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
}> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      fan: { select: { username: true, avatarUrl: true } },
      idol: { select: { stageName: true, avatarUrl: true } },
    },
  });
  
  // Return user info with fallbacks
  return {
    username: user.fan?.username || user.idol?.stageName || 'unknown',
    displayName: user.fan?.username || user.idol?.stageName || 'Unknown User',
    avatarUrl: user.fan?.avatarUrl || user.idol?.avatarUrl || null,
    email: user.email,
  };
}
```

### 3. Post Retrieval (With Fresh Data)

```typescript
// Get single post
async getPost(postId: string, request: IRequest) {
  const postDoc = await firestore.collection('posts').doc(postId).get();
  const postData = postDoc.data();
  
  // Fetch fresh user info from PostgreSQL
  return await this.mapPostToDto(postId, postData);
}

// Get multiple posts
async getPosts(query: GetPostsRequest) {
  const snapshot = await firestoreQuery.get();
  
  // Fetch user info for all posts in parallel
  const postsData = await Promise.all(
    snapshot.docs.map(doc => this.mapPostToDto(doc.id, doc.data()))
  );
  
  return { data: postsData, paging: pageInfo };
}
```

### 4. Mapping with Fresh Data

```typescript
private async mapPostToDto(postId: string, data: any): Promise<PostDto> {
  // Always fetch fresh user info from PostgreSQL
  const userInfo = await this.getUserInfo(data.userId);
  
  return {
    postId,
    userId: data.userId,
    displayName: userInfo.displayName,  // ✅ Always current
    userEmail: userInfo.email,          // ✅ Always current
    userAvatar: userInfo.avatarUrl,     // ✅ Always current
    content: data.content,
    // ... other fields
  };
}
```

## Performance Considerations

### Concern: Extra Database Queries
**Question:** Won't fetching user data for each post be slow?

**Answer:** We use performance optimizations:

1. **Parallel Fetching** - When loading multiple posts:
   ```typescript
   // Fetch all user info in parallel, not sequentially
   await Promise.all(posts.map(post => this.mapPostToDto(post)))
   ```

2. **Selective Fields** - Only fetch needed fields:
   ```typescript
   select: {
     email: true,
     fan: { select: { username: true, avatarUrl: true } },
     idol: { select: { stageName: true, avatarUrl: true } }
   }
   ```

3. **Future: Add Caching Layer** (Optional)
   ```typescript
   // Redis cache for 5 minutes
   const cachedUserInfo = await redis.get(`user:${userId}`);
   if (cachedUserInfo) return cachedUserInfo;
   
   const userInfo = await this.getUserInfo(userId);
   await redis.setex(`user:${userId}`, 300, userInfo);
   return userInfo;
   ```

### Performance Comparison

| Operation | Denormalized | SSOT (Current) | SSOT + Cache |
|-----------|-------------|----------------|--------------|
| Create Post | 1 query | 1 query | 1 query |
| Get 1 Post | 0 queries | 1 query | 0-1 query |
| Get 20 Posts | 0 queries | 20 queries (parallel) | 0-20 queries |
| User Changes Name | N updates (all posts) | 0 updates | Cache invalidation |

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Create Post Flow                         │
└─────────────────────────────────────────────────────────────┘

   Client Request                PostgreSQL              Firestore
        │                             │                       │
        │ POST /v1/post              │                       │
        ├────────────────────────────>│                       │
        │                             │ Verify user exists   │
        │                             │<─────────────────────>│
        │                             │                       │
        │                             │   Create post with    │
        │                             │   userId only         │
        │                             │──────────────────────>│
        │                             │                       │
        │   Fetch fresh user info     │                       │
        │<────────────────────────────│                       │
        │                             │                       │
        │   Return with user data     │                       │
        │<────────────────────────────┤                       │


┌─────────────────────────────────────────────────────────────┐
│                     Get Post Flow                            │
└─────────────────────────────────────────────────────────────┘

   Client Request                PostgreSQL              Firestore
        │                             │                       │
        │ GET /v1/post/:id           │                       │
        │                             │    Get post data      │
        │                             │<─────────────────────>│
        │                             │   (only userId)       │
        │                             │                       │
        │   Fetch fresh user info     │                       │
        │   using userId              │                       │
        │<────────────────────────────│                       │
        │                             │                       │
        │   Return merged data        │                       │
        │<────────────────────────────┤                       │
```

## Migration Guide (If Needed)

If you have existing posts with denormalized data:

### Option 1: Lazy Migration (Recommended)
- Keep existing fields in Firestore
- New posts only store userId
- Gradually remove old fields as posts age out

### Option 2: Active Migration
```typescript
async migratePostsToSSOT() {
  const posts = await firestore.collection('posts').get();
  
  const batch = firestore.batch();
  posts.docs.forEach(doc => {
    // Remove denormalized fields
    batch.update(doc.ref, {
      displayName: admin.firestore.FieldValue.delete(),
      userEmail: admin.firestore.FieldValue.delete(),
      userAvatar: admin.firestore.FieldValue.delete(),
    });
  });
  
  await batch.commit();
  console.log(`Migrated ${posts.size} posts`);
}
```

## Best Practices

### ✅ DO:
- Store only references (IDs) in Firestore
- Fetch user data on-demand from PostgreSQL
- Use parallel fetching for multiple posts
- Handle missing users gracefully (return defaults)

### ❌ DON'T:
- Duplicate user data in Firestore
- Cache user data indefinitely
- Assume user data is immutable
- Skip user verification on post creation

## Example Scenarios

### Scenario 1: User Changes Name
```
Before (Denormalized):
❌ Must update all posts → Expensive, error-prone

After (SSOT):
✅ No action needed → Next fetch gets new name automatically
```

### Scenario 2: User Deletes Account
```
Before (Denormalized):
❌ Orphaned posts with stale user data

After (SSOT):
✅ getUserInfo returns default values
✅ Can easily filter out posts from deleted users
```

### Scenario 3: Privacy Settings Change
```
Before (Denormalized):
❌ User email stored in all posts

After (SSOT):
✅ Can check current privacy settings
✅ Only expose email if user allows
```

## Testing Considerations

### Test Cases to Verify:
1. ✅ Create post → User info fetched correctly
2. ✅ Get post → Shows current user data
3. ✅ User changes name → Posts reflect new name immediately
4. ✅ User changes avatar → Posts show new avatar
5. ✅ Deleted user → Posts handle gracefully
6. ✅ Performance → Parallel fetching works
7. ✅ Cache invalidation → If caching is implemented

## Future Enhancements

### 1. Caching Layer (Redis)
```typescript
@Cacheable('user-info', 300) // 5 minutes
async getUserInfo(userId: string) {
  // Implementation
}
```

### 2. Batch User Fetching
```typescript
// Fetch unique users once for all posts
const uniqueUserIds = [...new Set(posts.map(p => p.userId))];
const users = await this.getUserInfoBatch(uniqueUserIds);
```

### 3. GraphQL DataLoader Pattern
```typescript
const userLoader = new DataLoader(async (userIds) => {
  return await this.prisma.user.findMany({
    where: { id: { in: userIds } }
  });
});
```

## Summary

The refactored architecture provides:
- ✅ **Data Consistency** - User info always up-to-date
- ✅ **Simplified Logic** - No sync mechanisms needed
- ✅ **Maintainability** - Single source of truth
- ✅ **Scalability** - Can add caching easily
- ✅ **Reliability** - Fewer edge cases to handle

This is the recommended pattern for any entity relationships in distributed systems.
