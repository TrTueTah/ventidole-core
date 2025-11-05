# PostgreSQL Schema Analysis & Recommendations

## 🎯 Current Schema Analysis

### ✅ What's Good

Your current authentication schema is **well-designed** with:

1. **✅ Account Model** - Good foundation
   - Proper indexing (email unique)
   - Soft delete support (`isDeleted`)
   - Online status tracking (`isOnline`)
   - Role-based access (FAN, ADMIN, IDOL)
   - Social auth support via `SocialAccount`

2. **✅ Verification System** - Excellent!
   - Multiple verification types
   - Token expiration tracking
   - Email verification before account creation
   - Password reset support

3. **✅ Social Authentication** - Good structure
   - Google & Facebook support
   - Proper foreign keys with cascade delete

### ⚠️ What Could Be Better

1. **Missing Profile Information**
   - No avatar/photo URL
   - No bio/description
   - No date of birth
   - No location/country

2. **No Relationship Structure**
   - No followers/following
   - No blocks/mutes

3. **Limited Role System**
   - Could benefit from permissions/capabilities

## 🎨 Recommended PostgreSQL Schema for Authentication + Social Features

### Strategy: **PostgreSQL for Structure, Firebase for Content**

```
PostgreSQL (Relational)          Firebase (Real-time)
─────────────────────           ────────────────────
✅ User accounts                ✅ Posts
✅ Profiles                     ✅ Comments
✅ Relationships (follow)       ✅ Likes (counters)
✅ Permissions                  ✅ Real-time feeds
✅ Blocks/Reports               ✅ Notifications
✅ User settings                ✅ Chat messages
```

## 📝 Improved PostgreSQL Schema

Here's what I recommend adding to your `schema.prisma`:

### 1. Enhanced Account with Profile

```prisma
model Account {
  id              String          @id @default(cuid())
  isActive        Boolean         @default(true)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  version         Int             @default(0)
  
  // Basic Info
  email           String          @unique @db.VarChar(255)
  phoneNumber     String?         @db.VarChar(255)
  password        String          @db.VarChar(255)
  role            Role
  
  // Profile Info (NEW)
  name            String?         @db.VarChar(255)
  username        String?         @unique @db.VarChar(50) // NEW: unique username
  bio             String?         @db.VarChar(500)        // NEW: user bio
  avatarUrl       String?         @db.VarChar(500)        // NEW: profile photo
  coverUrl        String?         @db.VarChar(500)        // NEW: cover photo
  dateOfBirth     DateTime?       @map("date_of_birth")   // NEW
  location        String?         @db.VarChar(255)        // NEW
  website         String?         @db.VarChar(500)        // NEW
  
  // Status
  isOnline        Boolean         @default(false) @map("is_online")
  isDeleted       Boolean         @default(false) @map("is_deleted")
  isVerified      Boolean         @default(false) @map("is_verified") // NEW: email verified
  lastSeenAt      DateTime?       @map("last_seen_at")    // NEW
  
  // Device
  deviceToken     String?         @db.VarChar(255)
  
  // Stats (denormalized for performance)
  followersCount  Int             @default(0) @map("followers_count")  // NEW
  followingCount  Int             @default(0) @map("following_count")  // NEW
  postsCount      Int             @default(0) @map("posts_count")      // NEW
  
  // Relations
  social_accounts SocialAccount[]
  verifications   Verification[]
  following       Follow[]        @relation("UserFollowing")  // NEW
  followers       Follow[]        @relation("UserFollowers")  // NEW
  blocks          Block[]         @relation("BlockedBy")      // NEW
  blockedBy       Block[]         @relation("Blocked")        // NEW
  settings        UserSettings?   // NEW

  @@index([username])
  @@index([email])
  @@index([isActive, isDeleted])
  @@map("accounts")
}
```

### 2. Follow System (NEW)

```prisma
model Follow {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  
  follower    Account  @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  following   Account  @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}
```

### 3. Block System (NEW)

```prisma
model Block {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  
  blockerId   String   @map("blocker_id")
  blockedId   String   @map("blocked_id")
  reason      String?  @db.VarChar(500)
  
  blocker     Account  @relation("BlockedBy", fields: [blockerId], references: [id], onDelete: Cascade)
  blocked     Account  @relation("Blocked", fields: [blockedId], references: [id], onDelete: Cascade)

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
  @@map("blocks")
}
```

### 4. User Settings (NEW)

```prisma
model UserSettings {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  accountId String   @unique @map("account_id")
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  
  // Privacy Settings
  isPrivate         Boolean @default(false) @map("is_private")
  allowTagging      Boolean @default(true) @map("allow_tagging")
  allowComments     Boolean @default(true) @map("allow_comments")
  
  // Notification Settings
  emailNotifications Boolean @default(true) @map("email_notifications")
  pushNotifications  Boolean @default(true) @map("push_notifications")
  
  // Content Settings
  language          String  @default("en") @db.VarChar(10)
  theme             String  @default("light") @db.VarChar(20)

  @@map("user_settings")
}
```

### 5. Report System (NEW - for moderation)

```prisma
model Report {
  id          String       @id @default(cuid())
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  reporterId  String       @map("reporter_id")
  reportedId  String?      @map("reported_id") // null if reporting content
  contentType ContentType  @map("content_type") // POST, COMMENT, USER
  contentId   String       @map("content_id")   // Firebase document ID
  reason      ReportReason
  description String?      @db.VarChar(1000)
  status      ReportStatus @default(PENDING)
  
  // Resolution
  reviewedBy  String?      @map("reviewed_by")
  reviewedAt  DateTime?    @map("reviewed_at")
  resolution  String?      @db.VarChar(500)

  @@index([reporterId])
  @@index([reportedId])
  @@index([status])
  @@index([createdAt])
  @@map("reports")
}

enum ContentType {
  POST
  COMMENT
  USER
  MESSAGE
}

enum ReportReason {
  SPAM
  HARASSMENT
  INAPPROPRIATE_CONTENT
  VIOLENCE
  HATE_SPEECH
  FALSE_INFORMATION
  COPYRIGHT
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWING
  RESOLVED
  DISMISSED
}
```

## 🔥 Firebase Schema for Posts & Comments

### Firestore Collections Structure

```javascript
// Collection: posts
posts/{postId}
{
  userId: string,              // Account.id from PostgreSQL
  username: string,            // Denormalized for performance
  userAvatar: string,          // Denormalized
  content: string,
  mediaUrls: string[],         // Images/videos
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // Counters (updated via Cloud Functions)
  likesCount: number,
  commentsCount: number,
  sharesCount: number,
  
  // Metadata
  hashtags: string[],
  mentions: string[],
  location: string,
  
  // Status
  isDeleted: boolean,
  visibility: 'public' | 'followers' | 'private'
}

// Sub-collection: likes
posts/{postId}/likes/{userId}
{
  userId: string,
  likedAt: timestamp
}

// Sub-collection: comments
posts/{postId}/comments/{commentId}
{
  userId: string,
  username: string,
  userAvatar: string,
  content: string,
  createdAt: timestamp,
  likesCount: number,
  
  // Nested comments
  parentId: string | null,
  repliesCount: number
}

// Collection: feeds (user's personalized feed)
feeds/{userId}/posts/{postId}
{
  postId: string,
  authorId: string,
  createdAt: timestamp,
  score: number  // For ranking algorithm
}

// Collection: notifications
notifications/{notificationId}
{
  userId: string,              // Recipient
  actorId: string,             // Who triggered the notification
  type: 'like' | 'comment' | 'follow' | 'mention',
  contentId: string,           // Post/comment ID
  read: boolean,
  createdAt: timestamp
}
```

## 🎯 Why This Split?

### PostgreSQL (Structure & Identity)
- ✅ User accounts & authentication
- ✅ Relationships (follow/unfollow)
- ✅ User settings & preferences
- ✅ Blocks & reports (moderation)
- ✅ **Fast queries** with proper indexes
- ✅ **ACID transactions** for critical data
- ✅ **Data integrity** with foreign keys

### Firebase (Content & Real-time)
- ✅ Posts & comments (high volume)
- ✅ Likes & reactions (real-time counters)
- ✅ User feeds (personalized)
- ✅ Notifications (instant delivery)
- ✅ **Real-time updates** for mobile
- ✅ **Offline support** out of the box
- ✅ **Scalable** to millions of posts

## 📋 Migration Steps

### Step 1: Update Your Schema

Add the new models to `prisma/schema.prisma`:

```bash
# Add Follow, Block, UserSettings, Report models
# Run migration
npx prisma migrate dev --name add_social_features
```

### Step 2: Update Auth Service

```typescript
// When user registers, also create:
// 1. Account in PostgreSQL ✓
// 2. Profile in Firestore
// 3. Settings with defaults

async signUp(request: SignUpRequest) {
  // 1. Create account in PostgreSQL
  const account = await this.prisma.account.create({
    data: {
      email: request.email,
      password: hashedPassword,
      name: request.name,
      username: await this.generateUsername(request.name),
      role: 'FAN',
      isVerified: false,
      settings: {
        create: {} // Default settings
      }
    }
  });
  
  // 2. Create profile in Firestore (for real-time features)
  const firestore = this.firebaseService.getFirestore();
  await firestore.collection('users').doc(account.id).set({
    uid: account.id,
    email: account.email,
    username: account.username,
    displayName: account.name,
    avatarUrl: account.avatarUrl || null,
    bio: account.bio || '',
    isOnline: false,
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return account;
}
```

### Step 3: Follow/Unfollow Example

```typescript
async followUser(followerId: string, followingId: string) {
  // Transaction to ensure data consistency
  await this.prisma.$transaction([
    // 1. Create follow relationship
    this.prisma.follow.create({
      data: { followerId, followingId }
    }),
    
    // 2. Update follower count
    this.prisma.account.update({
      where: { id: followerId },
      data: { followingCount: { increment: 1 } }
    }),
    
    // 3. Update following count
    this.prisma.account.update({
      where: { id: followingId },
      data: { followersCount: { increment: 1 } }
    })
  ]);
  
  // 4. Send notification via Firebase
  await this.sendFollowNotification(followerId, followingId);
}
```

## 🔐 Security Considerations

### PostgreSQL Security Rules
```typescript
// In your NestJS services, always check:
// 1. User is authenticated
// 2. User has permission
// 3. Check blocks (users can't see blocked content)

async canViewProfile(viewerId: string, profileId: string) {
  // Check if viewer is blocked by profile owner
  const isBlocked = await this.prisma.block.findFirst({
    where: {
      blockerId: profileId,
      blockedId: viewerId
    }
  });
  
  if (isBlocked) throw new CustomError(ErrorCode.UserBlocked);
  
  return true;
}
```

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts - anyone can read, only owner can write
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null 
                   && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null 
                           && resource.data.userId == request.auth.uid;
    }
    
    // Comments
    match /posts/{postId}/comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null 
                           && resource.data.userId == request.auth.uid;
    }
    
    // User feeds - only owner can access
    match /feeds/{userId}/posts/{postId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Notifications - only recipient can access
    match /notifications/{notificationId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

## 📊 Performance Optimization

### Denormalization Strategy

Store frequently accessed data in both places:

```typescript
// When user updates profile in PostgreSQL
async updateProfile(userId: string, data: UpdateProfileDto) {
  // 1. Update PostgreSQL
  const account = await this.prisma.account.update({
    where: { id: userId },
    data: {
      name: data.name,
      username: data.username,
      avatarUrl: data.avatarUrl,
      bio: data.bio
    }
  });
  
  // 2. Update Firebase profile (denormalized)
  const firestore = this.firebaseService.getFirestore();
  await firestore.collection('users').doc(userId).update({
    displayName: data.name,
    username: data.username,
    avatarUrl: data.avatarUrl,
    bio: data.bio,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // 3. Update all user's posts (background job)
  await this.updateUserPostsProfile(userId, {
    username: data.username,
    userAvatar: data.avatarUrl
  });
  
  return account;
}
```

## 🎉 Summary

### Your Current Schema: **8/10** ✅

**Strengths:**
- Good verification system
- Proper social auth
- Clean structure

**Add These:**
- ✅ Username field (unique)
- ✅ Profile fields (avatar, bio, etc.)
- ✅ Follow/Block models
- ✅ User settings
- ✅ Stats counters (followers, posts)

### Recommended Split:

**PostgreSQL:**
- Users, auth, relationships, settings, moderation

**Firebase:**
- Posts, comments, likes, feeds, notifications

This gives you:
- ✅ **Fast authentication** (PostgreSQL)
- ✅ **Real-time updates** (Firebase)
- ✅ **Scalable** to millions of users
- ✅ **Cost effective** (use each DB for what it does best)

---

**Want me to generate the complete updated schema.prisma file?** 🚀
