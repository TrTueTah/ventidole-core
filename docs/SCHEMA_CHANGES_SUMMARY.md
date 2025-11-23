# Schema Refactoring Summary

## Overview

This document summarizes all the changes made to the database schema and codebase as part of the migration from the old schema to the new schema.

**Date:** 2025-11-23
**Migration File:** `prisma/migrations/20251123120350_refactor_group_to_community/migration.sql`

---

## 1. Database Schema Changes

### Table Renames

| Old Name | New Name |
|----------|----------|
| `groups` | `community` |
| `fan_follow_group` | `community_follower` |
| `fans` | `user` |
| `verifications` | `verification` |
| `social_accounts` | `social_account` |
| `idols` | `idol` |
| `chat_channels` | `chat_channel` |
| `chat_participants` | `chat_participant` |

### Column Renames

#### Community Table
| Old Column | New Column |
|------------|------------|
| `groupName` | `name` |
| `logoUrl` | `avatarUrl` |

#### Idol Table
| Old Column | New Column |
|------------|------------|
| `groupId` | `communityId` |

#### CommunityFollower Table
| Old Column | New Column |
|------------|------------|
| `fanId` | `userId` |
| `groupId` | `communityId` |

#### ChatChannel Table
| Old Column | New Column |
|------------|------------|
| `groupId` | `communityId` |

### New Columns Added

#### Community Table
- `is_deleted` (BOOLEAN, default: false)
- `deleted_at` (TIMESTAMP)
- `metadata` (JSONB)

#### CommunityFollower Table
- `is_deleted` (BOOLEAN, default: false)
- `deleted_at` (TIMESTAMP)
- `metadata` (JSONB)

#### User Table (if not exists)
- `is_deleted` (BOOLEAN, default: false)
- `deleted_at` (TIMESTAMP)
- `metadata` (JSONB)

### Models Removed

The following Prisma models were removed as they were not part of the original schema design:

- `Fan` (merged into `User`)
- `Product`
- `ProductCategory`
- `ProductVariant`
- `Cart`
- `CartItem`
- `Order`
- `OrderItem`

### Enums Removed

- `OrderStatus` (no longer needed after removing ecommerce models)

---

## 2. Prisma Schema Changes

### Final Schema Structure

The schema now contains only these models:

1. **User** - User accounts (merged from Fan model)
   - Relations: `socialAccounts`, `verifications`, `idol`, `followedCommunities`, `chatParticipants`

2. **Verification** - Email verification tokens
   - Relations: `user`

3. **SocialAccount** - OAuth social login accounts
   - Relations: `user`

4. **Idol** - Idol profiles
   - Relations: `user`, `community`, `chatChannels`

5. **Community** - Communities (renamed from Group)
   - Relations: `idols`, `followers`, `chatChannels`

6. **CommunityFollower** - User follows community (renamed from FanFollowGroup)
   - Relations: `user`, `community`

7. **ChatChannel** - Chat channels
   - Relations: `community`, `idol`, `participants`

8. **ChatParticipant** - Chat participants
   - Relations: `channel`, `user`

### Table Mappings (all singular now)

```prisma
@@map("user")
@@map("verification")
@@map("social_account")
@@map("idol")
@@map("community")
@@map("community_follower")
@@map("chat_channel")
@@map("chat_participant")
```

---

## 3. API Changes

### Route Changes

| Old Route | New Route |
|-----------|-----------|
| `/v1/admin/groups` | `/v1/admin/communities` |

### Swagger Tags

| Old Tag | New Tag |
|---------|---------|
| `Admin Groups` | `Admin Communities` |

---

## 4. Module & File Structure Changes

### Directory Renames

```
src/domain/admin/groups/          → src/domain/admin/communities/
```

### File Renames

All files in the admin module were renamed:

| Old Filename | New Filename |
|--------------|--------------|
| `admin-groups.controller.ts` | `admin-communities.controller.ts` |
| `admin-groups.service.ts` | `admin-communities.service.ts` |
| `admin-groups.module.ts` | `admin-communities.module.ts` |
| `create-group.request.ts` | `create-community.request.ts` |
| `get-groups.request.ts` | `get-communities.request.ts` |
| `update-group.request.ts` | `update-community.request.ts` |
| `create-group.response.ts` | `create-community.response.ts` |
| `get-groups.response.ts` | `get-communities.response.ts` |

### Class & DTO Renames

| Old Name | New Name |
|----------|----------|
| `AdminGroupsController` | `AdminCommunitiesController` |
| `AdminGroupsService` | `AdminCommunitiesService` |
| `AdminGroupsModule` | `AdminCommunitiesModule` |
| `CreateGroupRequest` | `CreateCommunityRequest` |
| `GetGroupsRequest` | `GetCommunitiesRequest` |
| `UpdateGroupRequest` | `UpdateCommunityRequest` |
| `CreateGroupResponse` | `CreateCommunityResponse` |
| `GetGroupsResponse` | `GetCommunitiesResponse` |

---

## 5. Foreign Key Updates

### Old Foreign Keys (Dropped)

- `idols_groupId_fkey`
- `chat_channels_groupId_fkey`
- `fan_follow_group_fanId_fkey`
- `fan_follow_group_groupId_fkey`

### New Foreign Keys (Added)

- `idol_communityId_fkey` → references `community(id)`
- `chat_channel_communityId_fkey` → references `community(id)`
- `community_follower_userId_fkey` → references `user(id)`
- `community_follower_communityId_fkey` → references `community(id)`

---

## 6. Index Updates

### Dropped Indexes

- `fan_follow_group_fanId_groupId_key`
- `fan_follow_group_fanId_idx`
- `fan_follow_group_groupId_idx`
- `chat_channels_groupId_idx`

### Created Indexes

- `community_follower_userId_communityId_key` (unique)
- `community_follower_userId_idx`
- `community_follower_communityId_idx`
- `chat_channel_communityId_idx`

---

## 7. Backward Compatibility

### DTO Mapping

For backward compatibility, DTOs map old field names to new ones:

```typescript
export class CreateCommunityResponse {
  // Old field name supported for backward compatibility
  groupName: string;  // mapped to: data.name || data.groupName
  logoUrl?: string;   // mapped to: data.avatarUrl || data.logoUrl

  // New field names
  name: string;
  avatarUrl?: string;
}
```

---

## 8. Build & Generation Status

✅ **Prisma Schema:** Valid and formatted
✅ **Prisma Client:** Generated successfully
✅ **TypeScript Build:** Compiled without errors (215 files)
✅ **Migration File:** Created and ready to apply

---

## 9. Next Steps

To apply these changes to your database:

1. **Backup your database** (CRITICAL!)
   ```bash
   pg_dump -h your-host -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Review the migration SQL**
   - File: `prisma/migrations/20251123120350_refactor_group_to_community/migration.sql`

3. **Apply the migration**

   **Option A: Using Prisma Migrate**
   ```bash
   npx prisma migrate deploy
   ```

   **Option B: Using psql**
   ```bash
   psql "postgresql://..." -f prisma/migrations/20251123120350_refactor_group_to_community/migration.sql
   ```

   **Option C: Using Supabase SQL Editor**
   - Copy the migration SQL
   - Paste into SQL Editor
   - Execute

4. **Verify the migration**
   ```sql
   -- Check table names
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;

   -- Check community table structure
   \d community;

   -- Check data
   SELECT id, name, "avatarUrl" FROM community LIMIT 5;
   ```

5. **Test the application**
   ```bash
   npm run start:dev
   curl http://localhost:3000/v1/admin/communities
   ```

---

## 10. Documentation

For detailed instructions, see:

- **[RUN_MIGRATION.md](./RUN_MIGRATION.md)** - Step-by-step migration guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migration overview and planning
- **[FIRESTORE_RECOMMENDATION_SYSTEM.md](./FIRESTORE_RECOMMENDATION_SYSTEM.md)** - Post recommendation system

---

## 11. Rollback Plan

If something goes wrong, you can restore from backup:

```bash
psql "postgresql://..." < backup_file.sql
```

Or manually reverse the changes (see RUN_MIGRATION.md for detailed rollback steps).

---

**Status:** ✅ Ready to Deploy
**Created:** 2025-11-23
**Updated:** 2025-11-23
