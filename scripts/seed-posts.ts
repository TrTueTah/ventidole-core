import 'dotenv/config';
import { PrismaClient } from '../src/db/prisma/client';
import * as admin from 'firebase-admin';

const prisma = new PrismaClient();

// Initialize Firebase
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

let firebaseApp: admin.app.App;

try {
  firebaseApp = admin.app();
} catch {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
  });
}

const firestore = firebaseApp.firestore();

// Sample post content for idols
const idolPostContents = [
  {
    content: '✨ Hello everyone! Thank you for all your support! 💕',
    hashtags: ['thankful', 'fans', 'love'],
  },
  {
    content: 'Just finished rehearsal for our upcoming performance! So excited to show you what we\'ve been working on 🎤🎵',
    hashtags: ['rehearsal', 'performance', 'comingsoon'],
  },
  {
    content: 'Good morning! Hope everyone has an amazing day today ☀️',
    hashtags: ['goodmorning', 'positivity'],
  },
  {
    content: 'Behind the scenes from our latest photoshoot 📸✨',
    hashtags: ['photoshoot', 'behindthescenes'],
  },
  {
    content: 'Taking a break with some delicious food 🍜 What\'s your favorite meal?',
    hashtags: ['foodie', 'break'],
  },
];

// Sample post content for fans
const fanPostContents = [
  {
    content: 'I can\'t wait for the next concert! Who else is going? 🎫🎉',
    hashtags: ['concert', 'excited', 'fanlove'],
  },
  {
    content: 'Just got my new merch! The quality is amazing! 💕',
    hashtags: ['merch', 'collection', 'fanlife'],
  },
  {
    content: 'Listening to the new album on repeat! This is so good! 🎵',
    hashtags: ['newalbum', 'music', 'onrepeat'],
  },
  {
    content: 'Made some fan art today! Hope you all like it 🎨',
    hashtags: ['fanart', 'creative', 'art'],
  },
  {
    content: 'Who else has been a fan since day one? 🙋‍♀️',
    hashtags: ['dayone', 'loyalty', 'fanfamily'],
  },
  {
    content: 'The latest music video is absolutely stunning! 😍',
    hashtags: ['musicvideo', 'amazing', 'visuals'],
  },
  {
    content: 'Just joined this community! Happy to be here! 👋',
    hashtags: ['newbie', 'hello', 'excited'],
  },
];

// Media URLs to add to all posts
const mediaUrls = [
  'https://res.cloudinary.com/dsc9afexw/image/upload/v1762054385/kt1-6905e9f7e7ad5_z2wfqq.jpg',
  'https://res.cloudinary.com/dsc9afexw/image/upload/v1758008644/iK-Cji6J73Q-HD_nmbkfm.jpg',
  'https://res.cloudinary.com/dsc9afexw/image/upload/v1762853124/273532258_1528902877562442_6813889931345818717_n_bqaajl.webp',
];

async function seedPosts() {
  try {
    console.log('🌱 Starting to seed posts...\n');

    const postsCollection = firestore.collection('posts');
    const postMediaCollection = firestore.collection('post_media');

    // Delete all existing posts and media from Firestore
    console.log('🗑️  Deleting all existing posts and media...');

    // Delete posts
    const existingPosts = await postsCollection.get();
    const batchSize = 500;
    let batch = firestore.batch();
    let operationCount = 0;
    let deletedPostsCount = 0;

    for (const doc of existingPosts.docs) {
      batch.delete(doc.ref);
      operationCount++;
      deletedPostsCount++;

      if (operationCount === batchSize) {
        await batch.commit();
        batch = firestore.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    // Delete media
    const existingMedia = await postMediaCollection.get();
    batch = firestore.batch();
    operationCount = 0;
    let deletedMediaCount = 0;

    for (const doc of existingMedia.docs) {
      batch.delete(doc.ref);
      operationCount++;
      deletedMediaCount++;

      if (operationCount === batchSize) {
        await batch.commit();
        batch = firestore.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    console.log(`   ✅ Deleted ${deletedPostsCount} existing posts and ${deletedMediaCount} media items\n`);

    // Get all communities with their idols and followers
    const communities = await prisma.community.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      include: {
        idols: {
          select: {
            id: true,
            userId: true,
            stageName: true,
          },
        },
        followers: {
          where: {
            isDeleted: false,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    console.log(`📊 Found ${communities.length} communities\n`);

    let totalIdolPosts = 0;
    let totalFanPosts = 0;

    for (const community of communities) {
      console.log(`\n🏘️  Processing community: ${community.name}`);

      // Create posts from idols
      console.log(`  ⭐ Creating posts from ${community.idols.length} idols...`);
      for (const idol of community.idols) {
        // Each idol creates 2-4 posts
        const numPosts = Math.floor(Math.random() * 3) + 2; // 2-4 posts

        for (let i = 0; i < numPosts; i++) {
          const postContent = idolPostContents[Math.floor(Math.random() * idolPostContents.length)];

          const postData = {
            userId: idol.userId,
            communityId: community.id,
            content: postContent.content,
            contentType: 'mixed',
            hashtags: postContent.hashtags,
            location: null,
            visibility: 'public',
            mediaCount: mediaUrls.length,
            likesCount: Math.floor(Math.random() * 500) + 50, // 50-550 likes
            commentsCount: Math.floor(Math.random() * 100) + 10, // 10-110 comments
            sharesCount: Math.floor(Math.random() * 50), // 0-50 shares
            viewsCount: Math.floor(Math.random() * 1000) + 100, // 100-1100 views
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            isDeleted: false,
          };

          const postRef = await postsCollection.add(postData);
          const postId = postRef.id;

          // Create media in separate collection
          for (let j = 0; j < mediaUrls.length; j++) {
            await postMediaCollection.add({
              postId,
              url: mediaUrls[j],
              type: 'image',
              order: j,
              uploadedBy: idol.userId,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          totalIdolPosts++;
        }
      }
      console.log(`    ✅ Created posts from ${community.idols.length} idols`);

      // Create posts from fans (only if they follow this community)
      const fanUserIds = community.followers.map(f => f.userId);
      console.log(`  👥 Creating posts from ${fanUserIds.length} fans...`);

      // Select random fans to create posts (not all fans post)
      const numFansWhoPost = Math.min(Math.floor(fanUserIds.length * 0.6), fanUserIds.length); // 60% of fans post
      const fansWhoPost = fanUserIds.sort(() => Math.random() - 0.5).slice(0, numFansWhoPost);

      for (const fanUserId of fansWhoPost) {
        // Each fan creates 1-3 posts
        const numPosts = Math.floor(Math.random() * 3) + 1; // 1-3 posts

        for (let i = 0; i < numPosts; i++) {
          const postContent = fanPostContents[Math.floor(Math.random() * fanPostContents.length)];

          const postData = {
            userId: fanUserId,
            communityId: community.id,
            content: postContent.content,
            contentType: 'mixed',
            hashtags: postContent.hashtags,
            location: null,
            visibility: 'public',
            mediaCount: mediaUrls.length,
            likesCount: Math.floor(Math.random() * 100) + 5, // 5-105 likes (less than idols)
            commentsCount: Math.floor(Math.random() * 30) + 2, // 2-32 comments
            sharesCount: Math.floor(Math.random() * 10), // 0-10 shares
            viewsCount: Math.floor(Math.random() * 200) + 20, // 20-220 views
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            isDeleted: false,
          };

          const postRef = await postsCollection.add(postData);
          const postId = postRef.id;

          // Create media in separate collection
          for (let j = 0; j < mediaUrls.length; j++) {
            await postMediaCollection.add({
              postId,
              url: mediaUrls[j],
              type: 'image',
              order: j,
              uploadedBy: fanUserId,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          totalFanPosts++;
        }
      }
      console.log(`    ✅ Created posts from ${fansWhoPost.length} fans`);
    }

    // Print Summary
    console.log('\n\n📊 Posts Seeding Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`🏘️  Communities processed: ${communities.length}`);
    console.log(`⭐ Total idol posts: ${totalIdolPosts}`);
    console.log(`👥 Total fan posts: ${totalFanPosts}`);
    console.log(`📝 Grand total: ${totalIdolPosts + totalFanPosts} posts`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ Posts seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Error seeding posts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedPosts()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
