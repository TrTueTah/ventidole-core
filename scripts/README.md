# Seed Scripts

This directory contains seed scripts for populating the database with test data.

## Available Scripts

### 1. Seed Mock Data (`seed-mock-data.ts`)

Seeds the PostgreSQL database with:
- 1 Admin user
- 8 Idol users with profiles (across 3 communities)
- 15 Fan users
- 3 Communities (BLACKPINK, BTS, TWICE)
- Community followers (fans following communities)
- Chat channels (announcements, group chats, direct messages)
- Chat participants
- Social account links (Google/Facebook)

**Run with:**
```bash
npm run seed:mock
# or
yarn seed:mock
```

**Test Credentials:**
- Admin: `admin@ventidole.com` / `admin123`
- Idols: `jennie@ventidole.com`, `lisa@ventidole.com`, etc. / `admin123`
- Fans: `fan1@ventidole.com` to `fan15@ventidole.com` / `admin123`

---

### 2. Seed Posts (`seed-posts.ts`)

Seeds Firestore with test posts from both idols and fans:
- **Idol posts**: Each idol creates 2-4 posts with higher engagement metrics
- **Fan posts**: ~60% of community followers create 1-3 posts each
- All posts are public and include hashtags
- Posts have realistic engagement counts (likes, comments, shares, views)

**Features:**
- Ensures every community has posts from both idols AND fans
- Idol posts get higher engagement than fan posts (more realistic)
- Random sampling of post content from predefined templates
- Automatic timestamp assignment

**Run with:**
```bash
npm run seed:posts
# or
yarn seed:posts
```

**Prerequisites:**
- Must run `seed:mock` first to create users and communities
- Requires Firebase configuration in `.env`:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_CLIENT_EMAIL`

---

## Running All Seeds

To set up a complete test environment:

```bash
# 1. Seed PostgreSQL with users and communities
npm run seed:mock

# 2. Seed Firestore with posts
npm run seed:posts
```

---

## Notes

- All scripts use test data and should NOT be run in production
- Scripts are idempotent where possible (some may create duplicates on re-run)
- Check console output for summaries and any errors
- All passwords are hashed using bcrypt
- Timestamps are automatically generated
