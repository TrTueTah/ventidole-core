# Mock Data Seeding Guide

**Status:** ⏳ Pending - Database connection required

---

## Overview

A comprehensive mock data seeding script has been created to populate your database with realistic test data for development and testing purposes.

---

## 📋 Prerequisites

Before running the seed script, ensure:

1. ✅ Database is online and accessible
2. ✅ All migrations have been applied
3. ✅ Prisma client has been generated

---

## 🚀 How to Seed Mock Data

### Step 1: Apply Pending Migration (if not done)

```bash
# Apply the migration that adds avatar_url and background_url columns
npx prisma migrate deploy
```

### Step 2: Run the Seeding Script

```bash
# Run the TypeScript seeding script
npx ts-node scripts/seed-mock-data.ts
```

The script will:
- Create users (admin, idols, fans)
- Create communities
- Create idol profiles linked to communities
- Create community followers (fans following communities)
- Create chat channels (announcement, group, DM)
- Add participants to chat channels
- Link some users to social accounts (Google/Facebook)

---

## 📊 Mock Data Created

### Users (24 total)

#### 1 Admin User
- **Email:** admin@ventidole.com
- **Password:** admin123
- **Role:** ADMIN

#### 8 Idol Users (password: admin123)

| Email | Stage Name | Community |
|-------|------------|-----------|
| jennie@ventidole.com | Jennie | BLACKPINK |
| lisa@ventidole.com | Lisa | BLACKPINK |
| jisoo@ventidole.com | Jisoo | BLACKPINK |
| rose@ventidole.com | Rosé | BLACKPINK |
| rm@ventidole.com | RM | BTS |
| jungkook@ventidole.com | Jungkook | BTS |
| nayeon@ventidole.com | Nayeon | TWICE |
| sana@ventidole.com | Sana | TWICE |

#### 15 Fan Users (password: admin123)
- fan1@ventidole.com
- fan2@ventidole.com
- ... (through fan15@ventidole.com)

### Communities (3)

1. **BLACKPINK**
   - K-pop girl group formed by YG Entertainment
   - 4 idols

2. **BTS**
   - Korean boy band formed by Big Hit Entertainment
   - 2 idols (sample data)

3. **TWICE**
   - K-pop girl group formed by JYP Entertainment
   - 2 idols (sample data)

### Community Followers

- Each fan follows 1-3 random communities
- Approximately 30-45 total community follows

### Chat Channels (~19 channels)

#### Announcement Channels (3)
- BLACKPINK Official Announcements
- BTS Official Announcements
- TWICE Official Announcements

#### Group Chat Channels (3)
- BLACKPINK Fan Club
- BTS Fan Club
- TWICE Fan Club

#### Direct Message Channels (8)
- One DM channel for each idol

### Chat Participants (~100+)

- Fans are added to group chats of communities they follow
- Idols are admins in their community channels
- Random unread counts for realism

### Social Accounts (8)

- 5 Google account links (fan1-fan5)
- 3 Facebook account links (fan6-fan8)

---

## 🧪 Testing with Mock Data

### 1. Login as Admin

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ventidole.com",
    "password": "admin123"
  }'
```

### 2. Get All Communities

```bash
curl http://localhost:3000/v1/admin/communities \
  -H "Authorization: Bearer <your-token>"
```

### 3. Get Community Followers

```sql
SELECT
  cf.id,
  u.email as fan_email,
  c.name as community_name
FROM community_follower cf
JOIN "user" u ON cf."userId" = u.id
JOIN community c ON cf."communityId" = c.id
LIMIT 10;
```

### 4. Get Chat Channels

```sql
SELECT
  id,
  name,
  type,
  "isAnnouncement"
FROM chat_channel
ORDER BY type;
```

---

## 🔄 Re-seeding the Database

If you need to clear and re-seed:

### Option 1: Delete All Data (Keep Schema)

```sql
-- Delete in correct order to respect foreign keys
DELETE FROM chat_participant;
DELETE FROM chat_channel;
DELETE FROM community_follower;
DELETE FROM social_account;
DELETE FROM verification;
DELETE FROM idol;
DELETE FROM community;
DELETE FROM "user";
```

Then run the seed script again:
```bash
npx ts-node scripts/seed-mock-data.ts
```

### Option 2: Full Database Reset

```bash
# WARNING: This will delete ALL data and re-apply all migrations
npx prisma migrate reset

# Then seed
npx ts-node scripts/seed-mock-data.ts
```

---

## 📝 Seed Script Details

### Location
`scripts/seed-mock-data.ts`

### Features

- **Sequential Creation:** Creates data in the correct order to respect foreign keys
- **Realistic Data:** Uses placeholder images and realistic names
- **Random Relationships:** Fans follow random communities
- **Proper Roles:** Users have correct roles (ADMIN, IDOL, FAN)
- **Hashed Passwords:** All passwords are properly hashed with bcrypt
- **Error Handling:** Comprehensive error handling and logging
- **Summary Output:** Displays complete statistics after seeding

### Execution Time

Approximately 10-30 seconds depending on database speed.

---

## ⚠️ Troubleshooting

### Error: "The column `avatar_url` does not exist"

**Solution:** Apply the pending migration first:
```bash
npx prisma migrate deploy
```

### Error: "Can't reach database server"

**Solution:** Check if your database is online (Supabase dashboard)

### Error: "Unique constraint failed"

**Solution:** The database already has data. Either delete existing data or reset:
```bash
npx prisma migrate reset
```

### Error: "Cannot find module 'bcryptjs'"

**Solution:** Install dependencies:
```bash
npm install
```

### TypeScript Errors

**Solution:** Regenerate Prisma client:
```bash
npx prisma generate
```

---

## 🎯 After Seeding

Once seeding is complete:

1. **Start the development server:**
   ```bash
   npm run start:dev
   ```

2. **Access Swagger docs:**
   ```
   http://localhost:3000/api/docs
   ```

3. **Test login with any account** using the credentials above

4. **Explore the data** in your database viewer or through API endpoints

---

## 📈 Data Verification Queries

### Check Total Records

```sql
SELECT
  'users' as table_name, COUNT(*) as count FROM "user"
UNION ALL
SELECT 'communities', COUNT(*) FROM community
UNION ALL
SELECT 'idols', COUNT(*) FROM idol
UNION ALL
SELECT 'community_followers', COUNT(*) FROM community_follower
UNION ALL
SELECT 'chat_channels', COUNT(*) FROM chat_channel
UNION ALL
SELECT 'chat_participants', COUNT(*) FROM chat_participant
UNION ALL
SELECT 'social_accounts', COUNT(*) FROM social_account;
```

### Check User Roles Distribution

```sql
SELECT role, COUNT(*) as count
FROM "user"
GROUP BY role;
```

### Check Community Popularity

```sql
SELECT
  c.name,
  COUNT(cf.id) as follower_count
FROM community c
LEFT JOIN community_follower cf ON c.id = cf."communityId"
GROUP BY c.id, c.name
ORDER BY follower_count DESC;
```

---

**Created:** 2025-11-23
**Script:** `scripts/seed-mock-data.ts`
**Status:** Ready to run once database is online
