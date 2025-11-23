# Firestore Recommendation System Architecture

## 🎯 Overview

This document outlines the Firestore data model and architecture for a **personalized recommendation feed system** for a fan-idol platform (similar to Weverse, TikTok, Instagram).

### Key Requirements
- ✅ Real-time updates when new posts are published
- ✅ Efficient personalized feed generation per user
- ✅ Hybrid recommendation (Collaborative Filtering + Content-Based)
- ✅ Support for ranking signals (follow, engagement, content tags)
- ✅ Batch precomputation (nightly) + real-time scoring (online layer)
- ✅ Minimize Firestore read costs and avoid N+1 queries

---

## 📊 Firestore Schema Design

### 1. **posts** Collection

**Collection:** `posts/{postId}`

```typescript
{
  // Core Content
  id: string,                    // Auto-generated postId
  ownerId: string,               // User ID (fan or idol) who created the post
  communityId: string,           // Community this post belongs to
  content: string,               // Post text content (max 2000 chars)
  contentType: 'text' | 'media' | 'mixed',

  // Media
  mediaCount: number,            // Number of media items (for quick display)

  // Metadata
  visibility: 'public' | 'followers' | 'private',
  hashtags: string[],            // Array of hashtags for content-based filtering
  mentions: string[],            // Array of mentioned user IDs
  location: string | null,

  // Engagement Counters (Denormalized for performance)
  likesCount: number,
  commentsCount: number,
  sharesCount: number,
  viewsCount: number,            // NEW: Track impressions

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Soft Delete
  isDeleted: boolean,
  deletedAt: Timestamp | null,

  // Recommendation Signals (Pre-computed)
  engagementScore: number,       // Weighted score: likes + comments*2 + shares*3
  viralityScore: number,         // Rate of engagement over time
  recencyScore: number,          // Time-decay factor
  qualityScore: number,          // ML-based quality prediction (0-1)
}
```

**Indexes:**
```
- communityId + createdAt (DESC) → For community timeline
- ownerId + createdAt (DESC) → For user profile
- isDeleted + createdAt (DESC) → For feed queries
- engagementScore (DESC) + createdAt (DESC) → For trending
- hashtags (ARRAY) + createdAt (DESC) → For hashtag search
```

---

### 2. **post_media** Collection

**Collection:** `post_media/{mediaId}`

```typescript
{
  id: string,
  postId: string,                // Parent post reference
  url: string,                   // CDN URL to image/video
  type: 'image' | 'video' | 'gif',
  order: number,                 // Display order (0, 1, 2...)
  width: number | null,
  height: number | null,
  duration: number | null,       // For videos (seconds)
  thumbnailUrl: string | null,   // For videos
  uploadedBy: string,            // User ID
  createdAt: Timestamp,
}
```

**Indexes:**
```
- postId + order (ASC) → Fetch media for a post in order
```

**Why Separate Collection?**
- Reduces document size for posts (Firestore has 1MB limit)
- Allows efficient querying of posts without fetching large media arrays
- Better caching strategy (post metadata vs media URLs)

---

### 3. **post_like** Collection

**Collection:** `post_like/{likeId}`

```typescript
{
  id: string,
  userId: string,                // User who liked
  postId: string,                // Post that was liked
  createdAt: Timestamp,
}
```

**Indexes:**
```
- postId + createdAt (DESC) → Get likers of a post
- userId + postId → Check if user liked a post (unique constraint)
- userId + createdAt (DESC) → Get user's liked posts
```

**Alternative Design (Composite Key):**
```
Document ID: `{userId}_{postId}`
```
This eliminates need for userId+postId index and makes existence checks O(1).

---

### 4. **post_comment** Collection

**Collection:** `post_comment/{commentId}`

```typescript
{
  id: string,
  postId: string,
  userId: string,                // Commenter
  content: string,
  parentId: string | null,       // For nested replies

  // Counters
  likesCount: number,
  repliesCount: number,

  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // Soft Delete
  isDeleted: boolean,
  deletedAt: Timestamp | null,
}
```

**Indexes:**
```
- postId + createdAt (ASC) → Chronological comments
- postId + likesCount (DESC) → Top comments
- parentId + createdAt (ASC) → Nested replies
- userId + createdAt (DESC) → User's comment history
```

---

### 5. **user_feed** Collection (Personalized Feeds)

**Collection:** `user_feed/{userId}/feed_items/{itemId}`

This is a **subcollection** under each user that stores pre-computed personalized feed items.

```typescript
{
  postId: string,                // Reference to post
  score: number,                 // Personalized ranking score (0-100)
  reason: string,                // Why this was recommended: 'following' | 'trending' | 'similar' | 'popular'

  // Denormalized Post Data (for fast rendering without extra reads)
  ownerId: string,
  communityId: string,
  contentPreview: string,        // First 200 chars
  mediaCount: number,
  likesCount: number,
  commentsCount: number,
  createdAt: Timestamp,

  // Feed Management
  addedToFeedAt: Timestamp,      // When this item was added to user's feed
  seenAt: Timestamp | null,      // When user scrolled past it
  clickedAt: Timestamp | null,   // When user opened it
  dismissed: boolean,            // User hid this post
}
```

**Indexes:**
```
- score (DESC) + addedToFeedAt (DESC) → Ranked feed
- dismissed + score (DESC) → Filter out dismissed items
```

**Why Subcollection?**
- Each user has their own personalized feed
- Can be pre-computed in batches (nightly job)
- Supports incremental updates (new posts from followed communities)
- Avoids N+1 queries when fetching feed

---

### 6. **user_interactions** Collection (Engagement Tracking)

**Collection:** `user_interactions/{userId}/interactions/{interactionId}`

Tracks fine-grained user behavior for ML features.

```typescript
{
  postId: string,
  type: 'view' | 'click' | 'like' | 'comment' | 'share' | 'dismiss',
  duration: number | null,       // Dwell time in seconds (for views)
  timestamp: Timestamp,

  // Context
  source: 'feed' | 'profile' | 'community' | 'search' | 'notification',
  position: number | null,       // Position in feed when shown
}
```

**Indexes:**
```
- postId + type + timestamp → Aggregate engagement per post
- type + timestamp → Track user behavior patterns
```

**Purpose:**
- Train ML models (CTR prediction, dwell time prediction)
- Calculate engagement scores
- Identify user preferences (content-based filtering)

---

### 7. **user_preferences** Collection (User Profile)

**Collection:** `user_preferences/{userId}`

Stores aggregated user preferences for fast lookups.

```typescript
{
  // Following
  followedCommunities: string[],         // Array of community IDs

  // Content Preferences (Learned)
  preferredHashtags: Map<string, number>,  // hashtag → engagement score
  preferredIdols: Map<string, number>,     // idolId → affinity score

  // Engagement Stats
  avgDwellTime: number,                  // Average time spent per post
  likeRate: number,                      // % of posts liked
  commentRate: number,

  // Last Updated
  updatedAt: Timestamp,
}
```

**Purpose:**
- Fast user profile lookup for recommendation scoring
- Pre-computed features for real-time ranking

---

### 8. **trending_posts** Collection (Global Cache)

**Collection:** `trending_posts/{timeWindow}`

Pre-computed trending posts for different time windows.

```typescript
{
  id: string,                    // e.g., 'today', 'this_week', 'this_month'
  posts: Array<{
    postId: string,
    score: number,
    ownerId: string,
    communityId: string,
    createdAt: Timestamp,
  }>,
  computedAt: Timestamp,
  expiresAt: Timestamp,          // TTL for cache invalidation
}
```

**Purpose:**
- Fallback for new users with no history
- "Trending" tab in the app
- Reduces computation for popular queries

---

## 🔄 Feed Generation Architecture

### Two-Layer System

#### **1. Batch Layer (Offline/Nightly)**

**Runs:** Every 6-12 hours via Cloud Functions / Cloud Scheduler

**Process:**
1. **For each active user:**
   - Fetch `followedCommunities` from `user_preferences`
   - Query new posts from followed communities (last 24-48 hours)
   - Score each post using:
     ```
     score = w1*followScore + w2*engagementScore + w3*recencyScore + w4*qualityScore
     ```
   - Write top 100-500 items to `user_feed/{userId}/feed_items`
   - Add `reason: 'following'`

2. **Add diversity:**
   - Mix in trending posts (10-20%)
   - Mix in posts from similar communities (collaborative filtering)
   - Add popular posts from preferred idols

3. **Ranking:**
   - Sort by score (DESC)
   - Apply time decay
   - Ensure diversity (no more than 3 consecutive posts from same community)

**Cost Optimization:**
- Process users in batches (100-1000 at a time)
- Use Firestore bulk reads
- Cache intermediate results in Cloud Storage
- Only update feeds for active users (logged in last 7 days)

---

#### **2. Online Layer (Real-time)**

**Triggered:** When user opens the app

**Process:**
1. **Load pre-computed feed:**
   ```typescript
   const feedItems = await firestore
     .collection('user_feed')
     .doc(userId)
     .collection('feed_items')
     .where('dismissed', '==', false)
     .orderBy('score', 'desc')
     .limit(20)
     .get();
   ```

2. **Merge with real-time updates:**
   - Check for new posts from followed communities (last 1 hour)
   - Score them using lightweight formula
   - Inject at top of feed if score > threshold

3. **Track interactions:**
   - Log views to `user_interactions` (async, non-blocking)
   - Update `seenAt` in feed_items

**Pagination:**
```typescript
// Next page
const nextPage = await firestore
  .collection('user_feed')
  .doc(userId)
  .collection('feed_items')
  .where('dismissed', '==', false)
  .orderBy('score', 'desc')
  .startAfter(lastDoc)
  .limit(20)
  .get();
```

---

## 🎯 Ranking Signals & Scoring

### Scoring Formula

```javascript
score =
  0.3 * followScore +      // Is user following this community/idol?
  0.25 * engagementScore + // Likes, comments, shares
  0.2 * recencyScore +     // Time decay
  0.15 * affinityScore +   // User-idol affinity (collaborative filtering)
  0.1 * qualityScore       // ML-predicted quality
```

### Signal Definitions

#### **1. Follow Score**
```javascript
followScore = followedCommunities.includes(post.communityId) ? 100 : 0
```

#### **2. Engagement Score**
```javascript
engagementScore = Math.min(100,
  (post.likesCount * 1) +
  (post.commentsCount * 2) +
  (post.sharesCount * 3) +
  (post.viewsCount * 0.1)
)
```

#### **3. Recency Score (Time Decay)**
```javascript
const hoursSincePost = (now - post.createdAt) / 3600;
recencyScore = 100 * Math.exp(-hoursSincePost / 24); // Decay over 24 hours
```

#### **4. Affinity Score (Collaborative Filtering)**
```javascript
// Based on similar users' interactions
// "Users who liked posts from Idol A also liked posts from Idol B"
affinityScore = userPreferences.preferredIdols[post.ownerId] || 0;
```

#### **5. Quality Score (ML Model)**
```javascript
// Predict quality based on:
// - Content length, readability
// - Media presence
// - Past performance of similar posts
// - Creator's historical engagement rate
qualityScore = mlModel.predict(post); // 0-100
```

---

## 📈 Recommendation Algorithms

### **1. Hybrid Approach**

Combine multiple strategies:

#### **A. Content-Based Filtering**
- Match hashtags in post with user's `preferredHashtags`
- Match idols with `preferredIdols`
- Text similarity (TF-IDF) if user has interacted with similar content

#### **B. Collaborative Filtering**
- **User-User CF:** Find similar users based on interaction overlap
  ```sql
  SELECT userId2 FROM user_similarities
  WHERE userId1 = currentUser
  ORDER BY similarity DESC
  LIMIT 50
  ```
  → Recommend posts liked by similar users

- **Item-Item CF:** Find similar posts based on co-engagement
  ```sql
  SELECT postId2 FROM post_similarities
  WHERE postId1 IN (userLikedPosts)
  ORDER BY similarity DESC
  ```

#### **C. Social Graph Filtering**
- Prioritize posts from followed communities
- Boost posts from idols user frequently engages with

---

### **2. Diversity & Exploration**

Avoid filter bubbles by:

1. **Positional Diversity:**
   - No more than 3 consecutive posts from same community
   - Inject 1 "exploratory" post every 10 items

2. **Temporal Diversity:**
   - Mix posts from last hour, last day, last week

3. **Content Type Diversity:**
   - Alternate between text, image, video posts

4. **Exploration (Epsilon-Greedy):**
   - 90% exploitation (personalized recommendations)
   - 10% exploration (random trending posts)

---

## 💾 Data Flow Diagram

```
┌─────────────┐
│   User App  │
└──────┬──────┘
       │
       │ 1. Request Feed
       ▼
┌─────────────────────────┐
│  Feed Service (NestJS)  │
│  - Load user_feed       │
│  - Fetch real-time posts│
│  - Merge & rank         │
└──────┬──────────────────┘
       │
       │ 2. Query Firestore
       ▼
┌─────────────────────────┐
│  Firestore Collections  │
│  - user_feed/           │
│  - posts/               │
│  - post_media/          │
│  - user_preferences/    │
└──────┬──────────────────┘
       │
       │ 3. Return results
       ▼
┌─────────────┐
│  PostgreSQL │ (User, Idol, Community metadata)
└─────────────┘

                ┌─────────────────┐
                │  Batch Processor│
                │  (Cloud Function)│
                │  - Run nightly  │
                │  - Compute feeds│
                │  - Update scores│
                └────────┬────────┘
                         │
                         │ 4. Pre-compute feeds
                         ▼
                  ┌──────────────┐
                  │ user_feed/   │
                  │ trending_    │
                  │   posts/     │
                  └──────────────┘
```

---

## 🚀 Implementation Phases

### **Phase 1: Foundation (Week 1-2)**
- ✅ Create Firestore collections (posts, post_media, post_like, post_comment)
- ✅ Update Prisma schema (Community, CommunityFollower)
- ✅ Implement basic post CRUD with media support
- ✅ Track engagement (likes, comments, views)

### **Phase 2: Simple Feed (Week 3-4)**
- Implement chronological feed from followed communities
- Add basic ranking (engagement + recency)
- Create `user_feed` collection structure
- Build pagination & infinite scroll

### **Phase 3: Batch Recommendations (Week 5-6)**
- Build Cloud Function for nightly feed generation
- Implement collaborative filtering (user-user similarity)
- Create `user_preferences` collection
- Pre-compute feeds for all active users

### **Phase 4: Real-time Enhancements (Week 7-8)**
- Merge real-time posts with pre-computed feed
- Add trending posts cache
- Implement diversity algorithms
- A/B test ranking formulas

### **Phase 5: ML & Optimization (Week 9+)**
- Train quality prediction model
- Implement advanced CF (matrix factorization)
- Add content-based filtering (hashtag/text similarity)
- Optimize Firestore costs (caching, sharding)

---

## 💰 Cost Optimization Strategies

### **1. Reduce Firestore Reads**

#### **Denormalize Aggressively**
- Store post preview in `user_feed` (avoid extra read)
- Cache user info in posts (avoid PostgreSQL lookup)
- Pre-compute engagement scores

#### **Pagination Best Practices**
```typescript
// ❌ BAD: Offset pagination (reads all skipped docs)
const page3 = await posts.offset(40).limit(20).get();

// ✅ GOOD: Cursor pagination
const page3 = await posts.startAfter(lastDoc).limit(20).get();
```

#### **Batch Reads**
```typescript
// ✅ Fetch 100 posts at once, cache in memory
const posts = await firestore.collection('posts')
  .where('communityId', 'in', followedCommunities.slice(0, 10))
  .limit(100)
  .get();
```

---

### **2. Sharding**

For high-traffic collections (e.g., `post_like`), shard writes:

```typescript
// Document ID: {postId}_{shard}
const shardId = Math.floor(Math.random() * 10);
await firestore.doc(`post_like_shards/${postId}_${shardId}`)
  .set({ count: admin.firestore.FieldValue.increment(1) }, { merge: true });
```

Then aggregate reads:
```typescript
const totalLikes = await Promise.all(
  Array.from({ length: 10 }, (_, i) =>
    firestore.doc(`post_like_shards/${postId}_${i}`).get()
  )
).then(docs => docs.reduce((sum, doc) => sum + (doc.data()?.count || 0), 0));
```

---

### **3. Caching Strategy**

#### **Redis Cache**
```typescript
// Cache user_feed for 5 minutes
const cacheKey = `feed:${userId}:page:${page}`;
let feed = await redis.get(cacheKey);
if (!feed) {
  feed = await firestore.collection('user_feed').doc(userId)...;
  await redis.setex(cacheKey, 300, JSON.stringify(feed));
}
```

#### **CDN for Media**
- Store images/videos in Cloud Storage
- Use Cloud CDN for global distribution
- Set long cache headers (1 year)

---

### **4. Firestore Quotas**

**Free Tier Limits:**
- 50K reads/day
- 20K writes/day
- 20K deletes/day

**Typical Cost (Paid):**
- Reads: $0.06 per 100K
- Writes: $0.18 per 100K
- Deletes: $0.02 per 100K

**Estimation for 10K Daily Active Users:**
- Each user loads feed (20 posts): 200K reads/day = $0.12/day = **$3.60/month**
- With caching (50% hit rate): **$1.80/month**

---

## 🔍 Monitoring & Analytics

### **Key Metrics to Track**

1. **Feed Quality:**
   - CTR (Click-Through Rate): % of shown posts clicked
   - Dwell time: Average time spent per post
   - Engagement rate: % of posts liked/commented

2. **System Performance:**
   - Feed load time (p50, p95, p99)
   - Firestore read count per user
   - Cache hit rate

3. **Business Metrics:**
   - Daily active users
   - Posts per user per day
   - Community follow rate

### **Logging**

```typescript
// Log feed impressions
await firestore.collection('feed_analytics').add({
  userId,
  postIds: feed.map(p => p.postId),
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  source: 'batch' | 'realtime',
});

// Aggregate in BigQuery
// - Daily CTR per ranking algorithm
// - A/B test results (algorithm A vs B)
```

---

## 🎨 Best Practices Summary

### **DO ✅**
- Denormalize data to avoid N+1 queries
- Use cursor pagination (not offset)
- Pre-compute feeds in batches
- Cache aggressively (Redis, CDN)
- Track user interactions for ML
- Shard high-write collections
- Use composite keys for uniqueness checks

### **DON'T ❌**
- Don't query across all posts for every user
- Don't fetch full post documents if only need previews
- Don't use complex joins (keep Firestore flat)
- Don't ignore cache headers
- Don't skip indexes (will fail at scale)
- Don't store large arrays (>100 items) in single doc

---

## 📚 References & Further Reading

- [Firestore Data Modeling Best Practices](https://firebase.google.com/docs/firestore/data-model)
- [Building Scalable Feeds (Instagram Engineering)](https://instagram-engineering.com/what-powers-instagram-hundreds-of-instances-dozens-of-technologies-adf2e22da2ad)
- [TikTok's Recommendation System (Paper)](https://arxiv.org/abs/2202.02165)
- [Collaborative Filtering for Implicit Feedback](https://dl.acm.org/doi/10.1109/ICDM.2008.22)
- [The Netflix Recommender System](https://dl.acm.org/doi/10.1145/2843948)

---

## 🛠️ Next Steps

1. Review this architecture with your team
2. Set up Firestore indexes (see each collection's index section)
3. Implement Phase 1 (basic collections)
4. Build simple chronological feed
5. Gradually add ranking & personalization
6. Monitor costs and optimize

**Questions? Issues?** → Open a GitHub issue or contact the platform team.

---

**Last Updated:** 2025-11-23
**Version:** 1.0
**Author:** Claude Code (Anthropic)
