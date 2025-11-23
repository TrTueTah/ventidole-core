# Database Migration Guide: Group → Community Refactoring

## Overview

This guide explains how to migrate your database from the old schema (using `Group` and `FanFollowGroup`) to the new schema (using `Community` and `CommunityFollower`).

## Schema Changes

### 1. **Renamed Models**

| Old Model | New Model | Description |
|-----------|-----------|-------------|
| `Group` | `Community` | Renamed to better reflect fan-idol community concept |
| `FanFollowGroup` | `CommunityFollower` | Renamed to match new Community model |

### 2. **Field Changes**

#### **Community Model (formerly Group)**
- `groupName` → `name` (renamed for simplicity)
- `logoUrl` → `avatarUrl` (renamed for consistency)
- Added: `isDeleted` (soft delete support)
- Added: `deletedAt` (soft delete timestamp)
- Added: `metadata` (JSON field for extensibility)

#### **Idol Model**
- `groupId` → `communityId` (foreign key renamed)
- `group` → `community` (relation renamed)

#### **CommunityFollower Model (formerly FanFollowGroup)**
- `fanId` → `userId` (renamed to reflect that it references Fan.id)
- `groupId` → `communityId` (foreign key renamed)
- Added: `isDeleted` (soft delete support)
- Added: `deletedAt` (soft delete timestamp)
- Added: `metadata` (JSON field for extensibility)

---

## Migration Steps

### Step 1: Create Migration File

Since you have existing data in the database, you need to create a migration that properly handles the data transformation:

```bash
npx prisma migrate dev --create-only --name refactor_group_to_community
```

This will create a migration file in `prisma/migrations/`.

---

### Step 2: Customize the Migration SQL

The auto-generated migration will fail because it tries to add `communityId` without a default value to the `idols` table that already has data.

You need to manually edit the migration file to handle this. Here's the recommended SQL:

```sql
-- Step 1: Rename the 'groups' table to 'community'
ALTER TABLE "groups" RENAME TO "community";

-- Step 2: Rename columns in 'community' table
ALTER TABLE "community" RENAME COLUMN "groupName" TO "name";
ALTER TABLE "community" RENAME COLUMN "logoUrl" TO "avatarUrl";

-- Step 3: Add new columns to 'community'
ALTER TABLE "community" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "community" ADD COLUMN "metadata" JSONB;

-- Step 4: Update 'idols' table - rename foreign key
ALTER TABLE "idols" RENAME COLUMN "groupId" TO "communityId";

-- Step 5: Rename 'fan_follow_group' table to 'community_follower'
ALTER TABLE "fan_follow_group" RENAME TO "community_follower";

-- Step 6: Rename columns in 'community_follower'
ALTER TABLE "community_follower" RENAME COLUMN "fanId" TO "userId";
ALTER TABLE "community_follower" RENAME COLUMN "groupId" TO "communityId";

-- Step 7: Add new columns to 'community_follower'
ALTER TABLE "community_follower" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community_follower" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "community_follower" ADD COLUMN "metadata" JSONB;

-- Step 8: Update indexes
DROP INDEX IF EXISTS "fan_follow_group_fanId_groupId_key";
DROP INDEX IF EXISTS "fan_follow_group_fanId_idx";
DROP INDEX IF EXISTS "fan_follow_group_groupId_idx";

CREATE UNIQUE INDEX "community_follower_userId_communityId_key" ON "community_follower"("userId", "communityId");
CREATE INDEX "community_follower_userId_idx" ON "community_follower"("userId");
CREATE INDEX "community_follower_communityId_idx" ON "community_follower"("communityId");

-- Step 9: Update foreign key constraints
-- Drop old constraints
ALTER TABLE "idols" DROP CONSTRAINT IF EXISTS "idols_groupId_fkey";
ALTER TABLE "chat_channels" DROP CONSTRAINT IF EXISTS "chat_channels_groupId_fkey";
ALTER TABLE "community_follower" DROP CONSTRAINT IF EXISTS "fan_follow_group_fanId_fkey";
ALTER TABLE "community_follower" DROP CONSTRAINT IF EXISTS "fan_follow_group_groupId_fkey";

-- Add new constraints
ALTER TABLE "idols" ADD CONSTRAINT "idols_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_channels"
  RENAME COLUMN "groupId" TO "communityId";

ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_follower" ADD CONSTRAINT "community_follower_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "fans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_follower" ADD CONSTRAINT "community_follower_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Update chat_channels indexes
DROP INDEX IF EXISTS "chat_channels_groupId_idx";
CREATE INDEX "chat_channels_communityId_idx" ON "chat_channels"("communityId");
```

---

### Step 3: Apply the Migration

After customizing the migration file, apply it:

```bash
npx prisma migrate dev
```

---

### Step 4: Verify the Migration

Check that all data has been migrated correctly:

```sql
-- Check community table
SELECT id, name, "avatarUrl", description FROM community LIMIT 10;

-- Check idols have communityId
SELECT id, "stageName", "communityId", "userId" FROM idols LIMIT 10;

-- Check community_follower
SELECT id, "userId", "communityId", "createdAt" FROM community_follower LIMIT 10;
```

---

## Rollback Plan (If Needed)

If you need to rollback the migration:

```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

Then manually reverse the SQL changes, or restore from a database backup.

---

## Application Code Changes

The following modules have been updated to work with the new schema:

### ✅ Updated Modules

1. **Prisma Schema** ([schema.prisma](../prisma/schema.prisma))
   - Renamed `Group` → `Community`
   - Renamed `FanFollowGroup` → `CommunityFollower`
   - Updated all relations

2. **Collection Types** ([collection.types.ts](../src/types/collection.types.ts))
   - Added `postLikes`, `postMedia`, `postComments`

3. **Post Module** ([src/domain/post/](../src/domain/post/))
   - Added support for `post_like` collection
   - Added support for `post_media` collection
   - New endpoints: `POST /post/:postId/like`, `DELETE /post/:postId/like`

4. **Admin Groups Module** ([src/domain/admin/groups/](../src/domain/admin/groups/))
   - Updated to use `Community` model
   - Updated field mappings in DTOs

5. **Admin Idols Module** ([src/domain/admin/idols/](../src/domain/admin/idols/))
   - Updated to use `community` relation
   - Updated `communityId` field

---

## Testing Checklist

After migration, test the following:

- [ ] Create a new community (formerly group)
- [ ] List all communities with idols
- [ ] Create a new idol and assign to community
- [ ] Fan follows a community
- [ ] List fan's followed communities
- [ ] Create a post with media
- [ ] Like a post
- [ ] Unlike a post
- [ ] List posts with like status

---

## API Compatibility

### Backward Compatibility

The DTOs maintain backward compatibility by supporting both old and new field names:

```typescript
// Example from GroupDto
constructor(data: any) {
  this.groupName = data.name || data.groupName; // Supports both
  this.logoUrl = data.avatarUrl || data.logoUrl; // Supports both
}
```

This ensures that:
- Old client code continues to work
- New client code can use the updated field names
- Gradual migration is possible

---

## Firestore Collections

The following Firestore collections are now supported:

| Collection | Purpose | Document Structure |
|------------|---------|-------------------|
| `posts` | User posts | content, mediaCount, likesCount, etc. |
| `post_like` | Post likes | userId, postId, createdAt |
| `post_media` | Post media | postId, url, type, order |
| `post_comment` | Post comments | postId, userId, content |
| `comments` | Legacy comments | (existing) |
| `replies` | Comment replies | (existing) |

See [FIRESTORE_RECOMMENDATION_SYSTEM.md](./FIRESTORE_RECOMMENDATION_SYSTEM.md) for the full recommendation system architecture.

---

## Database Schema Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │         │   Community  │         │    Idol     │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id          │         │ id           │         │ id          │
│ email       │         │ name         │◄───────┤│ communityId │
│ password    │         │ description  │         │ stageName   │
│ role        │         │ avatarUrl    │         │ userId      │
└──────┬──────┘         │ backgroundUrl│         └──────┬──────┘
       │                │ isDeleted    │                │
       │                └──────▲───────┘                │
       │                       │                        │
       │                       │                        │
       │               ┌───────┴──────────┐             │
       │               │                  │             │
       │      ┌────────┴────────┐  ┌──────┴──────┐     │
       ├─────►│      Fan        │  │CommunityFoll│◄────┘
       │      ├─────────────────┤  │   ower      │
       │      │ id              │  ├─────────────┤
       │      │ userId          │  │ id          │
       │      │ username        │  │ userId      │
       │      │ avatarUrl       │  │ communityId │
       │      └─────────────────┘  │ isDeleted   │
       │                           └─────────────┘
       │
       └─────►User can be FAN, IDOL, or ADMIN
```

---

## Support & Issues

If you encounter any issues during migration:

1. Check the Prisma migration logs
2. Verify database constraints are properly updated
3. Review the [schema.prisma](../prisma/schema.prisma) file
4. Check application logs for Prisma errors

For questions, open an issue on GitHub.

---

**Migration Created:** 2025-11-23
**Version:** 1.0
**Author:** Claude Code (Anthropic)
