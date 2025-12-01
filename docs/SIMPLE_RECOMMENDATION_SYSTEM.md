# Simple ML-Based Recommendation System
## For University Final Project

## 🎯 Overview

This is a **simplified recommendation system** that uses machine learning but is practical for a university final project. It focuses on core concepts while remaining implementable within academic timeframes.

### Key Features
- ✅ **Content-Based Filtering** with TF-IDF
- ✅ **Simple Collaborative Filtering** using cosine similarity
- ✅ **Engagement-based scoring** (no complex time-series analysis)
- ✅ **Hybrid approach** (50% content + 50% collaborative)
- ✅ Uses existing Firestore schema (posts, likes, comments)
- ✅ Python ML scripts + NestJS API

---

## 📊 Data Model (Simplified)

### Existing Collections (Already in Your System)
```typescript
posts {
  id, ownerId, communityId, content, hashtags,
  likesCount, commentsCount, createdAt
}

post_like {
  userId, postId, createdAt
}

post_comment {
  userId, postId, content, createdAt
}
```

### New Collection (For Recommendations)
```typescript
user_recommendations/{userId} {
  recommendedPosts: [
    { postId, score, reason, createdAt }
  ],
  lastUpdated: Timestamp
}
```

---

## 🤖 ML Approach

### 1. Content-Based Filtering (TF-IDF)

**Concept:** Recommend posts similar to ones the user liked before.

**Implementation:**
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def content_based_recommendations(user_id, posts_data, user_likes):
    """
    posts_data: [{'id': '1', 'content': 'text', 'hashtags': ['tag1']}, ...]
    user_likes: ['post1', 'post2', ...] (posts user has liked)
    """
    
    # 1. Combine content + hashtags for each post
    texts = [
        f"{post['content']} {' '.join(post.get('hashtags', []))}"
        for post in posts_data
    ]
    
    # 2. Create TF-IDF matrix
    vectorizer = TfidfVectorizer(
        max_features=100,  # Keep it simple
        stop_words='english'
    )
    tfidf_matrix = vectorizer.fit_transform(texts)
    
    # 3. Find posts similar to user's liked posts
    liked_indices = [i for i, p in enumerate(posts_data) if p['id'] in user_likes]
    
    if not liked_indices:
        return []  # New user - no history
    
    # Average TF-IDF vector of liked posts
    user_profile = tfidf_matrix[liked_indices].mean(axis=0)
    
    # 4. Calculate similarity scores
    similarities = cosine_similarity(user_profile, tfidf_matrix).flatten()
    
    # 5. Get top 20 similar posts (exclude already liked)
    recommendations = []
    for idx in np.argsort(similarities)[::-1]:
        post_id = posts_data[idx]['id']
        if post_id not in user_likes:
            recommendations.append({
                'postId': post_id,
                'score': float(similarities[idx]),
                'reason': 'content_similarity'
            })
            if len(recommendations) >= 20:
                break
    
    return recommendations
```

---

### 2. Collaborative Filtering (User-User)

**Concept:** Recommend posts liked by similar users.

**Implementation:**
```python
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

def collaborative_filtering(user_id, user_post_matrix):
    """
    user_post_matrix: pandas DataFrame
    Rows = users, Columns = posts, Values = 1 (liked) or 0 (not liked)
    """
    
    # 1. Calculate user-user similarity
    user_similarities = cosine_similarity(user_post_matrix)
    
    # 2. Find current user's index
    user_idx = user_post_matrix.index.get_loc(user_id)
    
    # 3. Get top 10 similar users (exclude self)
    similar_users_indices = np.argsort(user_similarities[user_idx])[::-1][1:11]
    
    # 4. Get posts liked by similar users
    similar_users_likes = user_post_matrix.iloc[similar_users_indices].sum(axis=0)
    
    # 5. Exclude posts current user already liked
    user_likes = user_post_matrix.iloc[user_idx]
    candidate_posts = similar_users_likes[user_likes == 0]
    
    # 6. Sort by popularity among similar users
    recommendations = []
    for post_id in candidate_posts.sort_values(ascending=False).head(20).index:
        recommendations.append({
            'postId': post_id,
            'score': float(candidate_posts[post_id] / 10),  # Normalize
            'reason': 'similar_users'
        })
    
    return recommendations
```

---

### 3. Hybrid Scoring

**Combine both approaches:**
```python
def hybrid_recommendations(user_id, posts_data, user_likes, user_post_matrix):
    # Get recommendations from both methods
    content_recs = content_based_recommendations(user_id, posts_data, user_likes)
    collab_recs = collaborative_filtering(user_id, user_post_matrix)
    
    # Merge and average scores
    hybrid_scores = {}
    
    for rec in content_recs:
        hybrid_scores[rec['postId']] = hybrid_scores.get(rec['postId'], 0) + rec['score'] * 0.5
    
    for rec in collab_recs:
        hybrid_scores[rec['postId']] = hybrid_scores.get(rec['postId'], 0) + rec['score'] * 0.5
    
    # Sort by final score
    final_recs = [
        {'postId': pid, 'score': score, 'reason': 'hybrid'}
        for pid, score in sorted(hybrid_scores.items(), key=lambda x: x[1], reverse=True)
    ]
    
    return final_recs[:20]
```

---

## 🔄 System Architecture

```
┌──────────────┐
│  User App    │
└──────┬───────┘
       │
       │ GET /api/recommendations
       ▼
┌──────────────────────┐
│  NestJS API          │
│  - Check cache       │
│  - Return pre-       │
│    computed recs     │
└──────┬───────────────┘
       │
       │ Read from Firestore
       ▼
┌──────────────────────┐
│  Firestore           │
│  user_recommendations│
└──────┬───────────────┘
       ▲
       │
       │ Update (daily)
       │
┌──────────────────────┐
│  Python ML Script    │
│  (Cloud Function)    │
│  - Fetch posts/likes │
│  - Run ML algorithms │
│  - Save results      │
└──────────────────────┘
```

---

## 🛠️ Implementation Steps

### Step 1: Data Collection Script

**File:** `scripts/collect-training-data.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function collectTrainingData() {
  // 1. Get all posts
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      content: true,
      hashtags: true,
      likesCount: true,
      createdAt: true,
    },
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 1000, // Last 1000 posts
  });

  // 2. Get all likes (user-post interactions)
  const likes = await prisma.postLike.findMany({
    select: {
      userId: true,
      postId: true,
    },
  });

  // 3. Save to JSON files for Python processing
  fs.writeFileSync('./ml-data/posts.json', JSON.stringify(posts, null, 2));
  fs.writeFileSync('./ml-data/likes.json', JSON.stringify(likes, null, 2));

  console.log(`✅ Collected ${posts.length} posts and ${likes.length} likes`);
}

collectTrainingData();
```

---

### Step 2: ML Recommendation Script

**File:** `ml-scripts/generate_recommendations.py`

```python
import json
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
cred = credentials.Certificate('./serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def load_data():
    """Load posts and likes from JSON files"""
    with open('./ml-data/posts.json', 'r') as f:
        posts = json.load(f)
    
    with open('./ml-data/likes.json', 'r') as f:
        likes = json.load(f)
    
    return posts, likes

def create_user_post_matrix(likes):
    """Create user-post interaction matrix"""
    df = pd.DataFrame(likes)
    
    # Pivot to create matrix (users x posts)
    matrix = df.pivot_table(
        index='userId',
        columns='postId',
        aggfunc='size',
        fill_value=0
    )
    
    return matrix

def content_based_recommendations(user_id, posts, likes):
    """Content-based filtering using TF-IDF"""
    # Get user's liked posts
    user_likes = [l['postId'] for l in likes if l['userId'] == user_id]
    
    if len(user_likes) < 2:
        return []  # Not enough data
    
    # Create TF-IDF vectors
    texts = [f"{p.get('content', '')} {' '.join(p.get('hashtags', []))}" for p in posts]
    vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(texts)
    
    # User profile = average of liked posts
    liked_indices = [i for i, p in enumerate(posts) if p['id'] in user_likes]
    user_profile = tfidf_matrix[liked_indices].mean(axis=0)
    
    # Calculate similarities
    similarities = cosine_similarity(user_profile, tfidf_matrix).flatten()
    
    # Top recommendations
    recommendations = []
    for idx in np.argsort(similarities)[::-1]:
        post_id = posts[idx]['id']
        if post_id not in user_likes:
            recommendations.append({
                'postId': post_id,
                'score': float(similarities[idx]),
                'reason': 'content'
            })
            if len(recommendations) >= 15:
                break
    
    return recommendations

def collaborative_filtering(user_id, user_post_matrix):
    """Collaborative filtering using user similarity"""
    if user_id not in user_post_matrix.index:
        return []
    
    # Calculate user similarities
    user_similarities = cosine_similarity(user_post_matrix)
    user_idx = user_post_matrix.index.get_loc(user_id)
    
    # Find similar users
    similar_users_indices = np.argsort(user_similarities[user_idx])[::-1][1:11]
    
    # Aggregate their likes
    similar_users_likes = user_post_matrix.iloc[similar_users_indices].sum(axis=0)
    user_likes = user_post_matrix.iloc[user_idx]
    
    # Recommend posts not yet liked
    candidate_posts = similar_users_likes[user_likes == 0]
    
    recommendations = []
    for post_id in candidate_posts.sort_values(ascending=False).head(15).index:
        recommendations.append({
            'postId': post_id,
            'score': float(candidate_posts[post_id] / 10),
            'reason': 'collaborative'
        })
    
    return recommendations

def hybrid_recommendations(user_id, posts, likes, user_post_matrix):
    """Combine content-based and collaborative filtering"""
    content_recs = content_based_recommendations(user_id, posts, likes)
    collab_recs = collaborative_filtering(user_id, user_post_matrix)
    
    # Merge scores
    hybrid_scores = {}
    for rec in content_recs:
        hybrid_scores[rec['postId']] = rec['score'] * 0.5
    
    for rec in collab_recs:
        hybrid_scores[rec['postId']] = hybrid_scores.get(rec['postId'], 0) + rec['score'] * 0.5
    
    # Sort by final score
    final_recs = sorted(
        [{'postId': pid, 'score': score} for pid, score in hybrid_scores.items()],
        key=lambda x: x['score'],
        reverse=True
    )[:20]
    
    return final_recs

def save_to_firestore(user_id, recommendations):
    """Save recommendations to Firestore"""
    doc_ref = db.collection('user_recommendations').document(user_id)
    doc_ref.set({
        'recommendedPosts': recommendations,
        'lastUpdated': firestore.SERVER_TIMESTAMP
    })

def main():
    """Generate recommendations for all users"""
    posts, likes = load_data()
    user_post_matrix = create_user_post_matrix(likes)
    
    # Get unique users
    unique_users = set(l['userId'] for l in likes)
    
    print(f"Generating recommendations for {len(unique_users)} users...")
    
    for user_id in unique_users:
        recs = hybrid_recommendations(user_id, posts, likes, user_post_matrix)
        if recs:
            save_to_firestore(user_id, recs)
            print(f"✅ Saved {len(recs)} recommendations for user {user_id}")
    
    print("🎉 Done!")

if __name__ == '__main__':
    main()
```

---

### Step 3: NestJS API Endpoint

**File:** `src/recommendations/recommendations.controller.ts`

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@Req() req) {
    const userId = req.user.userId;
    return this.recommendationsService.getRecommendations(userId);
  }
}
```

**File:** `src/recommendations/recommendations.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../firestore/firestore.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly firestore: FirestoreService,
    private readonly prisma: PrismaService,
  ) {}

  async getRecommendations(userId: string) {
    // 1. Try to get from Firestore cache
    const cachedRecs = await this.firestore
      .collection('user_recommendations')
      .doc(userId)
      .get();

    if (cachedRecs.exists) {
      const data = cachedRecs.data();
      
      // 2. Enrich with post details
      const postIds = data.recommendedPosts.map(r => r.postId);
      const posts = await this.prisma.post.findMany({
        where: { id: { in: postIds } },
        include: {
          owner: { select: { id: true, username: true, avatar: true } },
          community: { select: { id: true, name: true } },
        },
      });

      // 3. Merge scores with post data
      const enriched = data.recommendedPosts.map(rec => {
        const post = posts.find(p => p.id === rec.postId);
        return post ? { ...post, recommendationScore: rec.score } : null;
      }).filter(Boolean);

      return {
        recommendations: enriched,
        lastUpdated: data.lastUpdated,
      };
    }

    // 4. Fallback: return popular posts
    return this.getFallbackRecommendations();
  }

  private async getFallbackRecommendations() {
    const popularPosts = await this.prisma.post.findMany({
      where: { isDeleted: false },
      orderBy: [
        { likesCount: 'desc' },
        { commentsCount: 'desc' },
      ],
      take: 20,
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        community: { select: { id: true, name: true } },
      },
    });

    return {
      recommendations: popularPosts,
      lastUpdated: null,
      note: 'Showing popular posts (no personalized recommendations yet)',
    };
  }
}
```

---

## ⏰ Scheduling (Daily Updates)

### Option 1: Cron Job (Simple)

Add to your server:

```typescript
// src/recommendations/recommendations.cron.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';

@Injectable()
export class RecommendationsCron {
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateRecommendations() {
    console.log('🤖 Starting ML recommendation generation...');
    
    // 1. Collect data
    exec('ts-node scripts/collect-training-data.ts', (err, stdout) => {
      if (err) {
        console.error('❌ Data collection failed:', err);
        return;
      }
      console.log(stdout);

      // 2. Run Python ML script
      exec('python3 ml-scripts/generate_recommendations.py', (err, stdout) => {
        if (err) {
          console.error('❌ ML generation failed:', err);
          return;
        }
        console.log(stdout);
        console.log('✅ Recommendations updated!');
      });
    });
  }
}
```

### Option 2: Cloud Function (Scalable)

Deploy `generate_recommendations.py` as a Google Cloud Function:

```bash
gcloud functions deploy generateRecommendations \
  --runtime python39 \
  --trigger-http \
  --entry-point main
```

---

## 📊 Evaluation Metrics (For Your Report)

```python
def evaluate_recommendations(test_likes, predictions):
    """Calculate precision, recall, F1-score"""
    correct = 0
    total_predicted = len(predictions)
    total_actual = len(test_likes)
    
    for pred in predictions:
        if pred['postId'] in test_likes:
            correct += 1
    
    precision = correct / total_predicted if total_predicted > 0 else 0
    recall = correct / total_actual if total_actual > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    return {
        'precision': precision,
        'recall': recall,
        'f1_score': f1
    }
```

---

## 🎓 University Project Report Structure

### 1. Introduction
- Problem: Personalized content recommendation
- Goal: Hybrid ML system using content + collaborative filtering

### 2. Literature Review
- TF-IDF for content similarity
- Cosine similarity for user-user collaborative filtering
- Hybrid recommendation systems

### 3. Methodology
- Data collection from Firestore
- Feature extraction (TF-IDF vectors)
- Similarity calculations
- Hybrid scoring algorithm

### 4. Implementation
- Python scikit-learn for ML
- NestJS API for serving recommendations
- Firestore for data storage

### 5. Results
- Precision, Recall, F1-score
- User engagement metrics (CTR, likes)
- Comparison: ML vs. random vs. popularity-based

### 6. Conclusion
- ML improves recommendation quality
- Future work: Deep learning, real-time updates

---

## 📦 Required Dependencies

**Python:**
```bash
pip install scikit-learn pandas numpy firebase-admin
```

**Node.js:**
```bash
npm install @nestjs/schedule
```

---

## ✅ Why This Is Simple Yet ML-Based

1. **No complex infrastructure** - Just Python scripts + NestJS
2. **Well-known algorithms** - TF-IDF, cosine similarity (easy to explain)
3. **Pre-computed** - No real-time ML (runs daily)
4. **Small dataset** - Works with 1000-5000 posts
5. **Proven approach** - Used in real recommendation systems
6. **Easy to evaluate** - Simple precision/recall metrics
7. **Implementable in 2-4 weeks** - Perfect for final project timeline

---

## 🚀 Next Steps

1. ✅ Implement data collection script
2. ✅ Write Python ML script
3. ✅ Test with sample data
4. ✅ Create NestJS API endpoints
5. ✅ Schedule daily updates
6. ✅ Collect evaluation metrics
7. ✅ Write project report

---

**Good luck with your final project! 🎓**
