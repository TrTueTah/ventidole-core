# Retrieving User Information with Posts - Best Practices

## 🎯 The Challenge

When fetching posts, you need user information (name, avatar, username) but:
- **PostgreSQL** has the user account data
- **Firebase** has the post data

**Problem:** Making a database call for EVERY post's user = slow and expensive! ❌

## ✅ Solution: Denormalization Strategy

### The Golden Rule
**Store frequently-accessed user data WITH the post in Firebase**

## 🔥 Firebase Post Structure (Recommended)

```javascript
// Collection: posts
posts/{postId}
{
  // Post Content
  postId: "abc123",
  content: "Check out my new photo!",
  mediaUrls: ["https://storage.../photo.jpg"],
  createdAt: timestamp,
  
  // USER DATA (DENORMALIZED) ← Store these!
  userId: "user-id-from-postgresql",
  username: "johndoe",              // ← Denormalized
  userName: "John Doe",              // ← Denormalized
  userAvatar: "https://storage.../avatar.jpg", // ← Denormalized
  userIsVerified: true,              // ← Denormalized (optional)
  
  // Post Stats
  likesCount: 42,
  commentsCount: 15,
  sharesCount: 3,
  
  // Metadata
  hashtags: ["travel", "sunset"],
  location: "Bali, Indonesia",
  visibility: "public"
}
```

## 📊 Data Flow

### When Creating a Post

```typescript
async createPost(userId: string, content: string, mediaUrls: string[]) {
  // 1. Get user info from PostgreSQL
  const user = await this.prisma.account.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      isVerified: true
    }
  });

  // 2. Create post in Firestore WITH user data
  const firestore = this.firebaseService.getFirestore();
  const postRef = await firestore.collection('posts').add({
    // User info (denormalized)
    userId: user.id,
    username: user.username,
    userName: user.name,
    userAvatar: user.avatarUrl,
    userIsVerified: user.isVerified,
    
    // Post content
    content,
    mediaUrls,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    
    // Stats
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    
    // Status
    isDeleted: false,
    visibility: 'public'
  });

  // 3. Update user's post count in PostgreSQL
  await this.prisma.account.update({
    where: { id: userId },
    data: { postsCount: { increment: 1 } }
  });

  return postRef.id;
}
```

### When Fetching Posts (Feed)

```typescript
async getFeed(userId: string, limit: number = 20) {
  const firestore = this.firebaseService.getFirestore();
  
  // Get posts from Firestore - NO need to query PostgreSQL!
  const postsSnapshot = await firestore
    .collection('posts')
    .where('visibility', '==', 'public')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const posts = postsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      
      // User info already in the post! ✅
      user: {
        id: data.userId,
        username: data.username,
        name: data.userName,
        avatar: data.userAvatar,
        isVerified: data.userIsVerified
      },
      
      // Post content
      content: data.content,
      mediaUrls: data.mediaUrls,
      createdAt: data.createdAt?.toDate(),
      
      // Stats
      stats: {
        likes: data.likesCount,
        comments: data.commentsCount,
        shares: data.sharesCount
      },
      
      // Metadata
      hashtags: data.hashtags,
      location: data.location
    };
  });

  return posts;
}
```

**Result:** ✅ One query gets EVERYTHING - super fast!

## 🔄 Keeping Data in Sync

### When User Updates Profile

```typescript
async updateUserProfile(userId: string, updates: UpdateProfileDto) {
  // 1. Update PostgreSQL (source of truth)
  const user = await this.prisma.account.update({
    where: { id: userId },
    data: {
      name: updates.name,
      username: updates.username,
      avatarUrl: updates.avatarUrl,
      bio: updates.bio
    }
  });

  // 2. Update Firestore user profile
  const firestore = this.firebaseService.getFirestore();
  await firestore.collection('users').doc(userId).update({
    displayName: updates.name,
    username: updates.username,
    avatarUrl: updates.avatarUrl,
    bio: updates.bio,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. Update ALL user's posts (background job recommended)
  await this.updateUserPostsProfile(userId, {
    userName: updates.name,
    username: updates.username,
    userAvatar: updates.avatarUrl
  });

  return user;
}

// Background job to update posts (can be slow, run async)
private async updateUserPostsProfile(
  userId: string, 
  updates: { userName?: string; username?: string; userAvatar?: string }
) {
  const firestore = this.firebaseService.getFirestore();
  
  // Get all user's posts
  const postsSnapshot = await firestore
    .collection('posts')
    .where('userId', '==', userId)
    .get();

  // Update in batches (Firestore limit: 500 per batch)
  const batch = firestore.batch();
  let count = 0;

  postsSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, updates);
    count++;
    
    // Commit every 500 operations
    if (count === 500) {
      batch.commit();
      count = 0;
    }
  });

  // Commit remaining
  if (count > 0) {
    await batch.commit();
  }

  this.logger.log(`Updated ${postsSnapshot.size} posts for user ${userId}`);
}
```

## 🎨 Complete Example: Post Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService,
  ) {}

  /**
   * Create a new post
   */
  async createPost(userId: string, createPostDto: CreatePostDto) {
    // 1. Get user info from PostgreSQL (one query)
    const user = await this.prisma.account.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Create post in Firestore WITH user data
    const firestore = this.firebase.getFirestore();
    const postData = {
      // User info (denormalized for fast retrieval)
      userId: user.id,
      username: user.username,
      userName: user.name,
      userAvatar: user.avatarUrl || null,
      userIsVerified: user.isVerified,

      // Post content
      content: createPostDto.content,
      mediaUrls: createPostDto.mediaUrls || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      // Stats
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,

      // Metadata
      hashtags: this.extractHashtags(createPostDto.content),
      mentions: this.extractMentions(createPostDto.content),
      location: createPostDto.location || null,

      // Status
      isDeleted: false,
      visibility: createPostDto.visibility || 'public',
    };

    const postRef = await firestore.collection('posts').add(postData);

    // 3. Update user's post count
    await this.prisma.account.update({
      where: { id: userId },
      data: { postsCount: { increment: 1 } },
    });

    return {
      postId: postRef.id,
      ...postData,
    };
  }

  /**
   * Get user feed (following + own posts)
   */
  async getFeed(userId: string, page: number = 1, limit: number = 20) {
    // 1. Get users that current user follows from PostgreSQL
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // Include own posts

    // 2. Get posts from Firestore (includes user data!)
    const firestore = this.firebase.getFirestore();
    const postsSnapshot = await firestore
      .collection('posts')
      .where('userId', 'in', followingIds)
      .where('isDeleted', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    // 3. Format response - user data already included!
    const posts = postsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        
        // User info (already in post - no extra query needed!)
        user: {
          id: data.userId,
          username: data.username,
          name: data.userName,
          avatar: data.userAvatar,
          isVerified: data.userIsVerified,
        },

        // Post content
        content: data.content,
        mediaUrls: data.mediaUrls,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),

        // Stats
        stats: {
          likes: data.likesCount || 0,
          comments: data.commentsCount || 0,
          shares: data.sharesCount || 0,
          views: data.viewsCount || 0,
        },

        // Metadata
        hashtags: data.hashtags || [],
        mentions: data.mentions || [],
        location: data.location,
        visibility: data.visibility,
      };
    });

    return {
      posts,
      page,
      limit,
      hasMore: posts.length === limit,
    };
  }

  /**
   * Get single post with user info
   */
  async getPost(postId: string, viewerId?: string) {
    const firestore = this.firebase.getFirestore();
    const postDoc = await firestore.collection('posts').doc(postId).get();

    if (!postDoc.exists) {
      throw new Error('Post not found');
    }

    const data = postDoc.data();

    // Check if viewer is blocked
    if (viewerId) {
      const isBlocked = await this.isUserBlocked(viewerId, data.userId);
      if (isBlocked) {
        throw new Error('You cannot view this post');
      }
    }

    // User info already in the post!
    return {
      id: postDoc.id,
      user: {
        id: data.userId,
        username: data.username,
        name: data.userName,
        avatar: data.userAvatar,
        isVerified: data.userIsVerified,
      },
      content: data.content,
      mediaUrls: data.mediaUrls,
      createdAt: data.createdAt?.toDate(),
      stats: {
        likes: data.likesCount,
        comments: data.commentsCount,
        shares: data.sharesCount,
      },
    };
  }

  /**
   * Get user's posts
   */
  async getUserPosts(username: string, viewerId?: string, limit: number = 20) {
    // 1. Get user from PostgreSQL
    const user = await this.prisma.account.findUnique({
      where: { username },
      select: { id: true, isPrivate: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Check privacy
    if (user.isPrivate && viewerId !== user.id) {
      const isFollowing = await this.prisma.follow.findFirst({
        where: { followerId: viewerId, followingId: user.id },
      });

      if (!isFollowing) {
        throw new Error('This account is private');
      }
    }

    // 3. Get posts from Firestore
    const firestore = this.firebase.getFirestore();
    const postsSnapshot = await firestore
      .collection('posts')
      .where('userId', '==', user.id)
      .where('isDeleted', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return postsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        user: {
          id: data.userId,
          username: data.username,
          name: data.userName,
          avatar: data.userAvatar,
        },
        content: data.content,
        mediaUrls: data.mediaUrls,
        createdAt: data.createdAt?.toDate(),
        stats: {
          likes: data.likesCount,
          comments: data.commentsCount,
          shares: data.sharesCount,
        },
      };
    });
  }

  // Helper methods
  private extractHashtags(content: string): string[] {
    const regex = /#(\w+)/g;
    const matches = content.match(regex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  private extractMentions(content: string): string[] {
    const regex = /@(\w+)/g;
    const matches = content.match(regex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  }

  private async isUserBlocked(viewerId: string, userId: string): Promise<boolean> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: viewerId },
          { blockerId: viewerId, blockedId: userId },
        ],
      },
    });
    return !!block;
  }
}
```

## 📊 Performance Comparison

### ❌ WITHOUT Denormalization (Bad)

```typescript
// Get 20 posts = 21 database queries! 😱
async getFeed() {
  const posts = await firestore.collection('posts').limit(20).get();
  
  for (const post of posts) {
    // Query PostgreSQL for EACH post's user
    const user = await prisma.account.findUnique({ 
      where: { id: post.userId } 
    });
  }
  // 1 query for posts + 20 queries for users = 21 queries!
}
```

**Performance:** 🐌 2-5 seconds for 20 posts

### ✅ WITH Denormalization (Good)

```typescript
// Get 20 posts = 1 query! 🚀
async getFeed() {
  const posts = await firestore.collection('posts').limit(20).get();
  // User data already in each post!
  return posts.docs.map(doc => ({
    ...doc.data(),
    user: {
      id: doc.data().userId,
      username: doc.data().username,
      name: doc.data().userName,
      avatar: doc.data().userAvatar
    }
  }));
}
```

**Performance:** ⚡ 50-200ms for 20 posts

## 🔧 Trade-offs

### Pros of Denormalization ✅
- ⚡ Super fast reads (1 query instead of N+1)
- 💰 Lower costs (fewer database queries)
- 📱 Better mobile experience (less latency)
- 🎯 Simpler code (no joins needed)

### Cons of Denormalization ⚠️
- 📝 Need to update posts when user changes profile
- 💾 Slightly more storage (duplicate user data)
- 🔄 Eventual consistency (updates may take time)

### Solution: Background Jobs

```typescript
// Use BullMQ for background updates
@Injectable()
export class ProfileUpdateConsumer {
  @Process('update-user-posts')
  async updateUserPosts(job: Job) {
    const { userId, updates } = job.data;
    
    const firestore = this.firebase.getFirestore();
    const posts = await firestore
      .collection('posts')
      .where('userId', '==', userId)
      .get();
    
    const batch = firestore.batch();
    posts.docs.forEach(doc => {
      batch.update(doc.ref, updates);
    });
    
    await batch.commit();
  }
}
```

## 🎯 Best Practices

### 1. Denormalize Read-Heavy Data
Store in posts:
- ✅ Username
- ✅ Display name
- ✅ Avatar URL
- ✅ Verification status

Don't store in posts:
- ❌ Email (private)
- ❌ Password (never!)
- ❌ Follower count (changes frequently)
- ❌ Settings (private)

### 2. Update Strategy

**Immediate:** Critical visual changes
```typescript
// User changes avatar - update immediately
await updateUserPosts(userId, { userAvatar: newAvatar });
```

**Background:** Non-critical changes
```typescript
// User changes bio - queue for background update
await this.queue.add('update-profile', { userId, updates });
```

### 3. Consistency Checks

Run periodic jobs to ensure consistency:
```typescript
async checkConsistency() {
  // Find posts with outdated user data
  // Update in batches
}
```

## 📱 Mobile App Example (React Native)

```typescript
// components/PostCard.tsx
interface Post {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  content: string;
  mediaUrls: string[];
  stats: {
    likes: number;
    comments: number;
  };
}

function PostCard({ post }: { post: Post }) {
  return (
    <View>
      {/* User info already in post - no loading needed! */}
      <View style={styles.header}>
        <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
        <Text>{post.user.name}</Text>
        {post.user.isVerified && <VerifiedBadge />}
      </View>
      
      <Text>{post.content}</Text>
      
      {post.mediaUrls.map(url => (
        <Image key={url} source={{ uri: url }} />
      ))}
      
      <View style={styles.stats}>
        <Text>{post.stats.likes} likes</Text>
        <Text>{post.stats.comments} comments</Text>
      </View>
    </View>
  );
}

// No loading states needed - all data comes in one query!
```

## 🎉 Summary

### The Answer
**Store user data (username, name, avatar) WITH each post in Firebase**

### Why?
- ⚡ 20x faster (1 query vs 21 queries)
- 💰 Much cheaper (fewer database calls)
- 📱 Better mobile experience
- 🎯 Simpler code

### Trade-off?
- Need to update posts when user changes profile
- Solution: Background jobs (not urgent, can be async)

### Result?
Instagram, Twitter, TikTok all use this pattern - it works at massive scale! 🚀

---

**Need the complete PostService code?** It's all in this file! Just copy and adapt to your needs.
