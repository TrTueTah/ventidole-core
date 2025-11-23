# How to Run the Database Migration

## 🎯 Overview

This guide will help you migrate your database from the old schema to the new schema with the following changes:
- Rename `Group` → `Community` and `FanFollowGroup` → `CommunityFollower`
- Rename `Fan` → `User` (merge Fan model into User)
- Change all table names from plural to singular (e.g., `idols` → `idol`, `verifications` → `verification`)
- Add soft delete fields (`is_deleted`, `deleted_at`, `metadata`)

**Migration File:** `prisma/migrations/20251123120350_refactor_group_to_community/migration.sql`

---

## ⚠️ IMPORTANT - Before You Start

### 1. **Backup Your Database**

Before running any migration, **ALWAYS create a backup**:

```bash
# For Supabase, use their dashboard to create a backup
# Or use pg_dump if you have direct access:
pg_dump -h aws-1-ap-southeast-1.pooler.supabase.com -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. **Check Your Environment**

Make sure your `.env` file has the correct database connection strings:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

---

## 🚀 Migration Steps

### Option 1: Using Prisma Migrate (Recommended)

If you have a local environment where the database is accessible:

```bash
# 1. Generate Prisma Client with new schema
npx prisma generate

# 2. Apply the migration
npx prisma migrate deploy
```

This will:
- Apply the migration SQL
- Update the `_prisma_migrations` table
- Ensure schema is in sync

---

### Option 2: Manual SQL Execution

If Prisma Migrate doesn't work, run the SQL directly:

#### **Using psql (CLI)**

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" \
  -f prisma/migrations/20251123120350_refactor_group_to_community/migration.sql
```

#### **Using Supabase SQL Editor**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `prisma/migrations/20251123120350_refactor_group_to_community/migration.sql`
4. Paste into the SQL Editor
5. Click **Run**

#### **Using pgAdmin or DBeaver**

1. Connect to your database
2. Open a new SQL query window
3. Copy and paste the migration SQL
4. Execute the query

---

### Option 3: Step-by-Step Manual Migration

If you want to run it step by step for safety:

#### **Step 1: Rename Tables**

```sql
-- Rename groups table
ALTER TABLE "groups" RENAME TO "community";

-- Rename fan_follow_group table
ALTER TABLE "fan_follow_group" RENAME TO "community_follower";
```

#### **Step 2: Rename Columns in Community**

```sql
ALTER TABLE "community" RENAME COLUMN "groupName" TO "name";
ALTER TABLE "community" RENAME COLUMN "logoUrl" TO "avatarUrl";
```

#### **Step 3: Add New Columns to Community**

```sql
ALTER TABLE "community" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "community" ADD COLUMN "metadata" JSONB;
```

#### **Step 4: Update Idols Table**

```sql
ALTER TABLE "idols" RENAME COLUMN "groupId" TO "communityId";
```

#### **Step 5: Update Community Follower**

```sql
ALTER TABLE "community_follower" RENAME COLUMN "fanId" TO "userId";
ALTER TABLE "community_follower" RENAME COLUMN "groupId" TO "communityId";

ALTER TABLE "community_follower" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community_follower" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "community_follower" ADD COLUMN "metadata" JSONB;
```

#### **Step 6: Update Chat Channels**

```sql
ALTER TABLE "chat_channels" RENAME COLUMN "groupId" TO "communityId";
```

#### **Step 7: Update Indexes**

```sql
-- Drop old indexes
DROP INDEX IF EXISTS "fan_follow_group_fanId_groupId_key";
DROP INDEX IF EXISTS "fan_follow_group_fanId_idx";
DROP INDEX IF EXISTS "fan_follow_group_groupId_idx";
DROP INDEX IF EXISTS "chat_channels_groupId_idx";

-- Create new indexes
CREATE UNIQUE INDEX "community_follower_userId_communityId_key" ON "community_follower"("userId", "communityId");
CREATE INDEX "community_follower_userId_idx" ON "community_follower"("userId");
CREATE INDEX "community_follower_communityId_idx" ON "community_follower"("communityId");
CREATE INDEX "chat_channels_communityId_idx" ON "chat_channels"("communityId");
```

#### **Step 8: Update Foreign Keys**

```sql
-- Drop old foreign keys
ALTER TABLE "idols" DROP CONSTRAINT IF EXISTS "idols_groupId_fkey";
ALTER TABLE "chat_channels" DROP CONSTRAINT IF EXISTS "chat_channels_groupId_fkey";
ALTER TABLE "community_follower" DROP CONSTRAINT IF EXISTS "fan_follow_group_fanId_fkey";
ALTER TABLE "community_follower" DROP CONSTRAINT IF EXISTS "fan_follow_group_groupId_fkey";

-- Add new foreign keys
ALTER TABLE "idols" ADD CONSTRAINT "idols_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_follower" ADD CONSTRAINT "community_follower_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_follower" ADD CONSTRAINT "community_follower_communityId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## ✅ Verification Steps

After running the migration, verify everything worked correctly:

### 1. **Check Table Structure**

```sql
-- Check community table
\d community;

-- Check community_follower table
\d community_follower;

-- Check idols table
\d idols;
```

### 2. **Verify Data**

```sql
-- Check community data
SELECT id, name, "avatarUrl", description, is_deleted FROM community LIMIT 5;

-- Check idols have communityId
SELECT id, "stageName", "communityId", "userId" FROM idols LIMIT 5;

-- Check community followers
SELECT id, "userId", "communityId", is_deleted FROM community_follower LIMIT 5;
```

### 3. **Verify Foreign Keys**

```sql
-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('idols', 'community_follower', 'chat_channels')
ORDER BY tc.table_name;
```

### 4. **Test Application**

After migration:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Start your application
npm run start:dev

# 3. Test the APIs
curl http://localhost:3000/v1/admin/communities

# 4. Check Swagger docs
open http://localhost:3000/api/docs
```

---

## 🔧 Troubleshooting

### Issue: "Relation does not exist"

**Solution:** Make sure you've run ALL steps of the migration. The order matters!

### Issue: "Foreign key constraint violation"

**Solution:** This shouldn't happen if the migration runs in order, but if it does:

1. Check that all data exists:
   ```sql
   -- Check for orphaned records
   SELECT * FROM idols WHERE "communityId" NOT IN (SELECT id FROM community);
   ```

2. If there are orphaned records, either:
   - Delete them
   - Create the missing community records

### Issue: "Column already exists"

**Solution:** The migration has already been partially run. You can either:

1. **Rollback** (if possible) and re-run
2. **Skip** the failing step and continue with remaining steps

---

## 🔄 Rollback Plan

If something goes wrong, restore from backup:

```bash
# Using pg_restore
pg_restore -h aws-1-ap-southeast-1.pooler.supabase.com -U postgres -d postgres backup_file.sql

# Or using psql
psql "postgresql://..." < backup_file.sql
```

Or manually reverse the changes:

```sql
-- Rename tables back
ALTER TABLE "community" RENAME TO "groups";
ALTER TABLE "community_follower" RENAME TO "fan_follow_group";

-- Rename columns back
ALTER TABLE "groups" RENAME COLUMN "name" TO "groupName";
ALTER TABLE "groups" RENAME COLUMN "avatarUrl" TO "logoUrl";

-- Remove new columns
ALTER TABLE "groups" DROP COLUMN "is_deleted";
ALTER TABLE "groups" DROP COLUMN "deleted_at";
ALTER TABLE "groups" DROP COLUMN "metadata";

-- Rename idol column back
ALTER TABLE "idols" RENAME COLUMN "communityId" TO "groupId";

-- Rename community_follower columns back
ALTER TABLE "fan_follow_group" RENAME COLUMN "userId" TO "fanId";
ALTER TABLE "fan_follow_group" RENAME COLUMN "communityId" TO "groupId";

-- Remove new columns from community_follower
ALTER TABLE "fan_follow_group" DROP COLUMN "is_deleted";
ALTER TABLE "fan_follow_group" DROP COLUMN "deleted_at";
ALTER TABLE "fan_follow_group" DROP COLUMN "metadata";

-- Rename chat_channels column back
ALTER TABLE "chat_channels" RENAME COLUMN "communityId" TO "groupId";

-- Then rebuild indexes and foreign keys...
```

---

## 📝 Post-Migration Checklist

- [ ] Migration SQL executed successfully
- [ ] All tables renamed correctly
- [ ] All columns renamed correctly
- [ ] New columns added
- [ ] Indexes updated
- [ ] Foreign keys updated
- [ ] Data verified (SELECT queries)
- [ ] `npx prisma generate` completed
- [ ] Application starts without errors
- [ ] API endpoints working (`/v1/admin/communities`)
- [ ] Swagger documentation updated
- [ ] Integration tests passing

---

## 🎉 Success!

Once all checks pass:

1. Delete the old backup (after a few days of successful operation)
2. Update your API documentation
3. Notify your team about the API changes
4. Update any client applications

---

## 📞 Support

If you encounter any issues:

1. Check the error message carefully
2. Review the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
3. Check Prisma documentation: https://www.prisma.io/docs/concepts/components/prisma-migrate
4. Open an issue on GitHub with the error details

---

**Created:** 2025-11-23
**Migration File:** `20251123120350_refactor_group_to_community`
**Status:** Ready to Apply
