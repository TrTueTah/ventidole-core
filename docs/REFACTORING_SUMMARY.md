# Schema Refactoring Summary

## 📋 Overview

This document summarizes all changes made to refactor the database schema from `Group/FanFollowGroup` to `Community/CommunityFollower` and implement the post recommendation system architecture.

**Date:** 2025-11-23
**Author:** Claude Code (Anthropic)

---

## ✅ Completed Tasks

### 1. **Prisma Schema Refactoring** ✅

**File:** [prisma/schema.prisma](../prisma/schema.prisma)

#### Changes:
- ✅ Renamed `Group` model → `Community` model
- ✅ Renamed `FanFollowGroup` model → `CommunityFollower` model
- ✅ Updated `Idol.groupId` → `Idol.communityId`
- ✅ Updated `ChatChannel.groupId` → `ChatChannel.communityId`
- ✅ Added `isDeleted`, `deletedAt`, `metadata` to `Community`
- ✅ Added `isDeleted`, `deletedAt`, `metadata` to `CommunityFollower`
- ✅ Renamed `Community.groupName` → `Community.name`
- ✅ Renamed `Community.logoUrl` → `Community.avatarUrl`
- ✅ Updated all foreign key relationships

**Lines Changed:** ~100 lines

---

### 2. **Firestore Collection Types** ✅

**Files:**
- [src/types/collection.types.ts](../src/types/collection.types.ts)
- [src/shared/service/collection/collections.service.ts](../src/shared/service/collection/collections.service.ts)

#### Changes:
- ✅ Added `postLikes: 'post_like'` collection
- ✅ Added `postMedia: 'post_media'` collection
- ✅ Added `postComments: 'post_comment'` collection

**Purpose:** Support new Firestore collections for the recommendation system.

---

### 3. **Post Module Refactoring** ✅

**Files:**
- [src/domain/post/post.service.ts](../src/domain/post/post.service.ts) - **+220 lines**
- [src/domain/post/post.controller.ts](../src/domain/post/post.controller.ts) - **+16 lines**

#### New Features:

##### A. Post Media Management
- ✅ `createPostMedia()` - Store media in separate `post_media` collection
- ✅ `getPostMedia()` - Retrieve media for a post
- ✅ `determineContentType()` - Classify posts as 'text', 'media', or 'mixed'
- ✅ `detectMediaType()` - Detect if media is image, video, or GIF

##### B. Post Like/Unlike
- ✅ `likePost()` - Like a post (creates `post_like` document)
- ✅ `unlikePost()` - Unlike a post (deletes `post_like` document)
- ✅ `hasUserLikedPost()` - Check if user has liked a post

##### C. Post Data Updates
- ✅ Added `contentType` field to posts
- ✅ Added `mediaCount` field (denormalized counter)
- ✅ Added `viewsCount` field (for recommendation system)
- ✅ Changed from inline `mediaUrls` array to separate `post_media` collection

#### New API Endpoints:
- `POST /v1/post/:postId/like` - Like a post
- `DELETE /v1/post/:postId/like` - Unlike a post

**Lines Changed:** ~236 lines

---

### 4. **Admin Groups Module** ✅

**Files:**
- [src/domain/admin/groups/admin-groups.service.ts](../src/domain/admin/groups/admin-groups.service.ts)
- [src/domain/admin/groups/response/get-groups.response.ts](../src/domain/admin/groups/response/get-groups.response.ts)
- [src/domain/admin/groups/response/create-group.response.ts](../src/domain/admin/groups/response/create-group.response.ts)

#### Changes:
- ✅ Updated `createGroup()` to use `prisma.community.create()`
- ✅ Updated `getAllGroups()` to use `prisma.community.findMany()`
- ✅ Added `isDeleted: false` filter to queries
- ✅ Updated DTOs to map `Community.name` → `groupName` (backward compatible)
- ✅ Updated DTOs to map `Community.avatarUrl` → `logoUrl` (backward compatible)

**Note:** API endpoints remain unchanged for backward compatibility. The module is still called "admin-groups" but works with the `Community` model internally.

---

### 5. **Admin Idols Module** ✅

**Files:**
- [src/domain/admin/idols/admin-idols.service.ts](../src/domain/admin/idols/admin-idols.service.ts)
- [src/domain/admin/idols/response/get-idols.response.ts](../src/domain/admin/idols/response/get-idols.response.ts)
- [src/domain/admin/idols/response/create-idol.response.ts](../src/domain/admin/idols/response/create-idol.response.ts)

#### Changes:
- ✅ Updated `createIdolAccount()` to check `prisma.community` (not `prisma.group`)
- ✅ Updated idol creation to use `communityId` field
- ✅ Updated `getAllIdols()` to include `community` relation
- ✅ Updated DTOs to map `Idol.communityId` → `groupId` (backward compatible)
- ✅ Updated DTOs to map `Idol.community` → `group` (backward compatible)

---

### 6. **Documentation** ✅

#### A. Firestore Recommendation System Architecture
**File:** [docs/FIRESTORE_RECOMMENDATION_SYSTEM.md](./FIRESTORE_RECOMMENDATION_SYSTEM.md)

**Content:** 700+ lines of comprehensive documentation including:
- Firestore schema design for all collections
- Recommendation algorithm architecture (hybrid CF + content-based)
- Two-layer feed system (batch + real-time)
- Ranking signals and scoring formulas
- Cost optimization strategies
- Best practices and anti-patterns
- Implementation phases
- Monitoring and analytics

#### B. Migration Guide
**File:** [docs/MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

**Content:** Complete database migration instructions including:
- Step-by-step migration SQL
- Rollback plan
- Testing checklist
- API backward compatibility notes
- Schema diagrams

#### C. This Summary Document
**File:** [docs/REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)

---

## 🗂️ File Changes Summary

| Module | Files Changed | Lines Added | Lines Modified |
|--------|---------------|-------------|----------------|
| Prisma Schema | 1 | ~50 | ~50 |
| Collection Types | 2 | ~6 | ~4 |
| Post Module | 2 | ~236 | ~20 |
| Admin Groups | 3 | ~10 | ~30 |
| Admin Idols | 3 | ~10 | ~25 |
| Documentation | 3 | ~1500 | 0 |
| **Total** | **14** | **~1812** | **~129** |

---

## 🎯 New Firestore Collections

### 1. **posts** (Updated)
```typescript
{
  userId: string,
  content: string,
  contentType: 'text' | 'media' | 'mixed', // NEW
  mediaCount: number,                       // NEW (replaces inline mediaUrls)
  viewsCount: number,                       // NEW
  likesCount: number,
  commentsCount: number,
  sharesCount: number,
  hashtags: string[],
  mentions: string[],
  visibility: 'public' | 'followers' | 'private',
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isDeleted: boolean,
}
```

### 2. **post_media** (New)
```typescript
{
  postId: string,
  url: string,
  type: 'image' | 'video' | 'gif',
  order: number,
  uploadedBy: string,
  createdAt: Timestamp,
}
```

**Composite Key:** Document ID = auto-generated

**Indexes:**
- `postId + order (ASC)` → Fetch media for post in order

### 3. **post_like** (New)
```typescript
{
  userId: string,
  postId: string,
  createdAt: Timestamp,
}
```

**Composite Key:** Document ID = `{userId}_{postId}`

**Why Composite Key?**
- O(1) existence check (no query needed)
- Enforces uniqueness (user can't like post twice)
- Fast like/unlike operations

**Indexes:**
- `postId + createdAt (DESC)` → Get likers of a post
- `userId + createdAt (DESC)` → Get user's liked posts

### 4. **post_comment** (Renamed from comments)
```typescript
{
  postId: string,
  userId: string,
  content: string,
  parentId: string | null,
  likesCount: number,
  repliesCount: number,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isDeleted: boolean,
}
```

---

## 🔄 Backward Compatibility

All DTOs maintain backward compatibility by supporting both old and new field names:

### Example: GroupDto
```typescript
constructor(data: any) {
  this.groupName = data.name || data.groupName;     // Supports both
  this.logoUrl = data.avatarUrl || data.logoUrl;   // Supports both
}
```

This means:
- ✅ Old API clients continue to work without changes
- ✅ New clients can use updated field names
- ✅ Gradual migration is possible

---

## 🚀 New API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/v1/post/:postId/like` | Like a post | Bearer (FAN, IDOL, ADMIN) |
| `DELETE` | `/v1/post/:postId/like` | Unlike a post | Bearer (FAN, IDOL, ADMIN) |

**Request:** None (postId in URL, userId from JWT)

**Response:**
```typescript
{
  status: 200,
  message: "success",
  data: {
    message: "Post liked successfully",
    likesCount: 42
  }
}
```

---

## 📊 Database Schema Changes

### Before (Old Schema)
```
Group {
  groupName
  logoUrl
  backgroundUrl
  description
}

FanFollowGroup {
  fanId
  groupId
}

Idol {
  groupId
  group (relation)
}
```

### After (New Schema)
```
Community {
  name                 // renamed from groupName
  avatarUrl            // renamed from logoUrl
  backgroundUrl
  description
  isDeleted            // NEW
  deletedAt            // NEW
  metadata             // NEW
}

CommunityFollower {
  userId               // renamed from fanId
  communityId          // renamed from groupId
  isDeleted            // NEW
  deletedAt            // NEW
  metadata             // NEW
}

Idol {
  communityId          // renamed from groupId
  community (relation) // renamed from group
}
```

---

## 🧪 Testing Recommendations

### Unit Tests Needed
- [ ] `PostService.likePost()` - should increment like count
- [ ] `PostService.unlikePost()` - should decrement like count
- [ ] `PostService.likePost()` - should throw error if already liked
- [ ] `PostService.createPostMedia()` - should create media documents
- [ ] `PostService.getPostMedia()` - should fetch media in order
- [ ] `AdminGroupsService.createGroup()` - should create Community
- [ ] `AdminIdolsService.createIdolAccount()` - should use communityId

### Integration Tests Needed
- [ ] Create community → List communities
- [ ] Create idol → Assign to community → Verify relation
- [ ] Fan follows community → List followed communities
- [ ] Create post with media → Verify media collection
- [ ] Like post → Check like count → Unlike → Verify count
- [ ] Create post → Fetch with media → Verify media URLs

### E2E Tests Needed
- [ ] Complete user journey: Sign up → Follow community → Like post
- [ ] Admin journey: Create community → Create idol → Assign idol

---

## ⚠️ Breaking Changes (For Direct DB Access)

If you have scripts or external tools that directly query the database:

### ❌ These queries will break:
```sql
SELECT * FROM groups;                          -- Table renamed
SELECT * FROM fan_follow_group;                -- Table renamed
SELECT groupName FROM groups;                  -- Column renamed
SELECT logoUrl FROM groups;                    -- Column renamed
SELECT groupId FROM idols;                     -- Column renamed
```

### ✅ Update to:
```sql
SELECT * FROM community;
SELECT * FROM community_follower;
SELECT name FROM community;
SELECT avatarUrl FROM community;
SELECT communityId FROM idols;
```

---

## 🔐 Security Considerations

### Post Likes
- ✅ Composite key prevents duplicate likes
- ✅ User can only like/unlike their own likes
- ✅ Post visibility checked before allowing like

### Post Media
- ✅ Media URLs stored separately (reduces document size)
- ✅ UploadedBy field tracks who added media
- ✅ Media URLs should be from trusted CDN only

**TODO:** Add server-side validation for media URLs to prevent malicious links.

---

## 📈 Performance Optimizations

### Post Likes
- **Composite Key:** `{userId}_{postId}` for O(1) existence check
- **Denormalized Counter:** `likesCount` in post document (no aggregation needed)
- **Atomic Updates:** `FieldValue.increment()` ensures consistency

### Post Media
- **Separate Collection:** Reduces post document size (Firestore has 1MB limit)
- **Ordered Retrieval:** `order` field ensures correct media sequence
- **Lazy Loading:** Media fetched only when needed

### Community Queries
- **Soft Delete Filter:** `isDeleted: false` prevents returning deleted records
- **Index on isDeleted:** Speeds up filtered queries

---

## 🛠️ Next Steps (TODO)

### High Priority
1. **Run Database Migration**
   - Follow [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
   - Test on staging environment first
   - Create database backup before migration

2. **Update Client Applications**
   - Update mobile app to use new field names (gradual migration)
   - Update admin dashboard to use "Community" terminology
   - Test backward compatibility

3. **Implement Recommendation System**
   - Follow [FIRESTORE_RECOMMENDATION_SYSTEM.md](./FIRESTORE_RECOMMENDATION_SYSTEM.md)
   - Start with Phase 1 (chronological feed)
   - Add batch processing (Cloud Functions)

### Medium Priority
4. **Add Indexes to Firestore**
   ```javascript
   // Run in Firebase Console
   db.collection('post_media').createIndex({
     fields: [
       { fieldPath: 'postId', mode: 'ASCENDING' },
       { fieldPath: 'order', mode: 'ASCENDING' }
     ]
   });

   db.collection('post_like').createIndex({
     fields: [
       { fieldPath: 'postId', mode: 'ASCENDING' },
       { fieldPath: 'createdAt', mode: 'DESCENDING' }
     ]
   });
   ```

5. **Add API Documentation**
   - Update Swagger docs for new endpoints
   - Add examples for like/unlike endpoints
   - Document backward compatibility

6. **Monitoring & Analytics**
   - Add metrics for like/unlike operations
   - Track post media storage costs
   - Monitor Firestore read/write quotas

### Low Priority
7. **Clean Up Old Code**
   - Remove any unused `Group`/`FanFollowGroup` references
   - Update comments and documentation
   - Consider renaming `admin-groups` module to `admin-communities`

8. **Add Features**
   - Post sharing functionality
   - Post bookmarking
   - Advanced media support (video thumbnails, image compression)
   - User feed personalization (ML-based ranking)

---

## 📞 Support & Questions

For questions or issues:
1. Check [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for database migration help
2. Check [FIRESTORE_RECOMMENDATION_SYSTEM.md](./FIRESTORE_RECOMMENDATION_SYSTEM.md) for architecture details
3. Review Prisma migration logs
4. Open a GitHub issue with detailed error logs

---

## 🎉 Summary

### What Was Done
- ✅ Complete database schema refactoring (Group → Community)
- ✅ Post module enhanced with like/unlike functionality
- ✅ Post media moved to separate collection for scalability
- ✅ All admin modules updated to use new schema
- ✅ Backward compatibility maintained in all DTOs
- ✅ Comprehensive documentation created

### Impact
- 🚀 **Better Scalability:** Separate post_media collection supports large posts
- 🎯 **Better Performance:** Composite keys for O(1) like checks
- 📱 **Better UX:** Real-time like counts, optimized media loading
- 🏗️ **Better Architecture:** Foundation for recommendation system
- 📊 **Better Analytics:** New fields support ML-based ranking

### Migration Effort
- **Database Migration:** 30 minutes (manual SQL + testing)
- **Code Deployment:** Standard deployment process
- **Client Updates:** Gradual (backward compatible)
- **Downtime:** None (if migration done carefully)

---

**Refactoring Completed:** 2025-11-23
**Version:** 1.0
**Status:** ✅ Ready for Migration
