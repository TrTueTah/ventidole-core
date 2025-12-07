import * as bcrypt from 'bcryptjs';
import 'dotenv/config';
import { PrismaClient } from '../src/db/prisma/client';

const prisma = new PrismaClient();

async function seedMockData() {
  try {
    console.log('🌱 Starting to seed mock data...\n');

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@ventidole.com',
        password: hashedPassword,
        username: 'admin',
        role: 'ADMIN',
        avatarUrl: 'https://i.pravatar.cc/150?img=1',
        backgroundUrl: 'https://picsum.photos/1200/400?random=1',
      },
    });
    console.log(`  ✅ Admin created: ${adminUser.email}\n`);

    // 2. Create Communities
    console.log('🏘️  Creating communities...');
    const communities = await Promise.all([
      prisma.community.create({
        data: {
          name: 'BLACKPINK',
          avatarUrl: 'https://i.pravatar.cc/300?img=20',
          backgroundUrl: 'https://picsum.photos/1200/400?random=2',
          description: 'K-pop girl group formed by YG Entertainment',
        },
      }),
      prisma.community.create({
        data: {
          name: 'BTS',
          avatarUrl: 'https://i.pravatar.cc/300?img=21',
          backgroundUrl: 'https://picsum.photos/1200/400?random=3',
          description: 'Korean boy band formed by Big Hit Entertainment',
        },
      }),
      prisma.community.create({
        data: {
          name: 'TWICE',
          avatarUrl: 'https://i.pravatar.cc/300?img=22',
          backgroundUrl: 'https://picsum.photos/1200/400?random=4',
          description: 'K-pop girl group formed by JYP Entertainment',
        },
      }),
    ]);
    console.log(`  ✅ Created ${communities.length} communities\n`);

    // 3. Create Idol Users
    console.log('⭐ Creating idol users...');
    const idolData = [
      {
        email: 'jennie@ventidole.com',
        username: 'Jennie',
        communityId: communities[0].id,
        bio: 'Main rapper of BLACKPINK',
      },
      {
        email: 'lisa@ventidole.com',
        username: 'Lisa',
        communityId: communities[0].id,
        bio: 'Main dancer of BLACKPINK',
      },
      {
        email: 'jisoo@ventidole.com',
        username: 'Jisoo',
        communityId: communities[0].id,
        bio: 'Lead vocalist of BLACKPINK',
      },
      {
        email: 'rose@ventidole.com',
        username: 'Rosé',
        communityId: communities[0].id,
        bio: 'Main vocalist of BLACKPINK',
      },
      {
        email: 'rm@ventidole.com',
        username: 'RM',
        communityId: communities[1].id,
        bio: 'Leader and rapper of BTS',
      },
      {
        email: 'jungkook@ventidole.com',
        username: 'Jungkook',
        communityId: communities[1].id,
        bio: 'Main vocalist of BTS',
      },
      {
        email: 'nayeon@ventidole.com',
        username: 'Nayeon',
        communityId: communities[2].id,
        bio: 'Lead vocalist of TWICE',
      },
      {
        email: 'sana@ventidole.com',
        username: 'Sana',
        communityId: communities[2].id,
        bio: 'Vocalist of TWICE',
      },
    ];

    const idols: any[] = [];
    for (let i = 0; i < idolData.length; i++) {
      const data = idolData[i];
      const idolUser = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          username: data.username.toLowerCase(),
          role: 'IDOL',
          bio: data.bio,
          communityId: data.communityId,
          avatarUrl: `https://i.pravatar.cc/150?img=${10 + i}`,
          backgroundUrl: `https://picsum.photos/1200/400?random=${10 + i}`,
        },
      });

      idols.push(idolUser);
    }
    console.log(`  ✅ Created ${idols.length} idol accounts\n`);

    // 4. Create Fan Users
    console.log('👥 Creating fan users...');
    const fans: any[] = [];
    for (let i = 0; i < 15; i++) {
      const fan = await prisma.user.create({
        data: {
          email: `fan${i + 1}@ventidole.com`,
          password: hashedPassword,
          username: `fan${i + 1}`,
          role: 'FAN',
          avatarUrl: `https://i.pravatar.cc/150?img=${30 + i}`,
          backgroundUrl: `https://picsum.photos/1200/400?random=${30 + i}`,
        },
      });
      fans.push(fan);
    }
    console.log(`  ✅ Created ${fans.length} fan accounts\n`);

    // 5. Create Community Followers (Fans follow communities)
    console.log('💙 Creating community followers...');
    const followers: any[] = [];

    // Each fan follows 1-3 random communities
    for (const fan of fans) {
      const numFollows = Math.floor(Math.random() * 3) + 1; // 1-3 communities
      const shuffledCommunities = [...communities].sort(
        () => Math.random() - 0.5,
      );

      for (let i = 0; i < numFollows; i++) {
        const follower = await prisma.communityFollower.create({
          data: {
            userId: fan.id,
            communityId: shuffledCommunities[i].id,
          },
        });
        followers.push(follower);
      }
    }
    console.log(`  ✅ Created ${followers.length} community follows\n`);

    // 6. Create Chat Channels
    console.log('💬 Creating chat channels...');
    const chatChannels: any[] = [];

    // Create announcement channels for each community
    for (const community of communities) {
      const channel = await prisma.chatChannel.create({
        data: {
          name: `${community.name} Official Announcements`,
          description: `Official announcements from ${community.name}`,
          type: 'ANNOUNCEMENT',
          communityId: community.id,
          isAnnouncement: true,
          firebaseDocId: `announcement_${community.id}`,
        },
      });
      chatChannels.push(channel);
    }

    // Create group chat for each community
    for (const community of communities) {
      const channel = await prisma.chatChannel.create({
        data: {
          name: `${community.name} Fan Club`,
          description: `General chat for ${community.name} fans`,
          type: 'GROUP',
          communityId: community.id,
          isAnnouncement: false,
          firebaseDocId: `group_${community.id}`,
        },
      });
      chatChannels.push(channel);
    }

    // Create direct message channels for each idol
    for (const idol of idols) {
      const channel = await prisma.chatChannel.create({
        data: {
          name: `DM with ${idol.username}`,
          description: `Direct messages with ${idol.username}`,
          type: 'DIRECT',
          idolId: idol.id,
          isAnnouncement: false,
          firebaseDocId: `dm_${idol.id}`,
        },
      });
      chatChannels.push(channel);
    }
    console.log(`  ✅ Created ${chatChannels.length} chat channels\n`);

    // 7. Create Chat Participants
    console.log('👤 Adding chat participants...');
    const participants: any[] = [];

    // Add fans to community group chats (only if they follow the community)
    for (const follower of followers) {
      const communityGroupChat = chatChannels.find(
        (ch) => ch.type === 'GROUP' && ch.communityId === follower.communityId,
      );

      if (communityGroupChat) {
        const participant = await prisma.chatParticipant.create({
          data: {
            channelId: communityGroupChat.id,
            userId: follower.userId,
            role: 'MEMBER',
            unreadCount: Math.floor(Math.random() * 10), // Random unread count
          },
        });
        participants.push(participant);
      }
    }

    // Add idols as admins to their community channels
    for (const idol of idols) {
      const communityChannels = chatChannels.filter(
        (ch) => ch.communityId === idol.communityId,
      );

      for (const channel of communityChannels) {
        const participant = await prisma.chatParticipant.create({
          data: {
            channelId: channel.id,
            userId: idol.id,
            role: 'ADMIN',
            unreadCount: 0,
          },
        });
        participants.push(participant);
      }
    }

    console.log(`  ✅ Created ${participants.length} chat participants\n`);

    // 8. Create Chat Messages
    console.log('💬 Creating chat messages...');
    const messages: any[] = [];
    const messageTemplates = [
      'Hello everyone!',
      'How are you all doing today?',
      'I love this community! 💕',
      "Can't wait for the next event!",
      'This is amazing!',
      'Thank you for all your support!',
      'You guys are the best! ❤️',
      'Excited to share this with you all!',
      'Great to be here!',
      'Looking forward to connecting with everyone!',
      'What a wonderful day!',
      'Sending love to all fans! 💖',
      'Stay healthy and happy!',
      'Thanks for being here!',
      'This community is incredible!',
    ];

    // Create 40-50 messages across different channels
    const numMessages = Math.floor(Math.random() * 11) + 40; // 40-50 messages
    for (let i = 0; i < numMessages; i++) {
      const channel =
        chatChannels[Math.floor(Math.random() * chatChannels.length)];
      // Get a participant from this channel
      const channelParticipants = participants.filter(
        (p) => p.channelId === channel.id,
      );

      if (channelParticipants.length > 0) {
        const participant =
          channelParticipants[
            Math.floor(Math.random() * channelParticipants.length)
          ];
        const message = await prisma.chatMessage.create({
          data: {
            content:
              messageTemplates[
                Math.floor(Math.random() * messageTemplates.length)
              ],
            channelId: channel.id,
            userId: participant.userId,
            createdAt: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ), // Random date within last 30 days
          },
        });
        messages.push(message);
      }
    }
    console.log(`  ✅ Created ${messages.length} chat messages\n`);

    // 9. Create Posts
    console.log('📝 Creating posts...');
    const posts: any[] = [];
    const idolPostContents = [
      "Just finished an amazing photoshoot today! Can't wait to share the results with you all! 📸✨",
      'Thank you for all your support! You mean the world to me! 💕',
      'New music coming soon! Stay tuned! 🎵',
      'Behind the scenes from our latest project! 🎬',
      'Grateful for this beautiful day and all of you! 🌟',
      'Practice makes perfect! Working hard for the upcoming performance! 💪',
      'Just wrapped up rehearsals! Feeling excited! 🎤',
      'Thank you for 1M followers! This is incredible! 🎉',
      'Sunset views from the studio! 🌅',
      'Quick selfie before showtime! 🤳',
      'Reading your messages always makes my day! 💌',
      'Feeling inspired and creative today! 🎨',
    ];

    const fanPostContents = [
      "Coffee time ☕ What's everyone up to today?",
      'Throwback to some amazing memories! Missing these times! 📷',
      'Feeling blessed and thankful! 🙏',
      'Late night thoughts... What keeps you motivated?',
      'Weekend vibes! How are you spending your weekend? 😊',
      'New hair, who dis? 💇‍♀️✨',
      'Cooking experiments today... wish me luck! 👩‍🍳',
      'Guess where I am today? 🤔',
      'Beautiful day outside! 🌞',
      'Just discovered this amazing song! 🎶',
      'Movie night recommendations? 🎬',
      'Finally finished that book! 📚',
    ];

    // Media URLs to be used in some posts
    const availableMediaUrls = [
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1762054385/kt1-6905e9f7e7ad5_z2wfqq.jpg',
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1758008644/iK-Cji6J73Q-HD_nmbkfm.jpg',
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1762853124/273532258_1528902877562442_6813889931345818717_n_bqaajl.webp',
    ];

    // Helper function to randomly select media URLs (0-3 images)
    const getRandomMediaUrls = (): string[] => {
      const shouldHaveMedia = Math.random() > 0.4; // 60% chance of having media
      if (!shouldHaveMedia) return [];

      const numImages = Math.floor(Math.random() * 3) + 1; // 1-3 images
      const shuffled = [...availableMediaUrls].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, numImages);
    };

    // Create 20-25 posts from idol users
    const numIdolPosts = Math.floor(Math.random() * 6) + 20; // 20-25 posts
    for (let i = 0; i < numIdolPosts; i++) {
      const idol = idols[Math.floor(Math.random() * idols.length)];
      const post = await prisma.post.create({
        data: {
          content:
            idolPostContents[
              Math.floor(Math.random() * idolPostContents.length)
            ],
          authorId: idol.id,
          communityId: idol.communityId,
          mediaUrls: getRandomMediaUrls(),
          likeCount: 0, // Will be updated later
          commentCount: 0, // Will be updated later
          viewCount: 0, // Will be updated later
          createdAt: new Date(
            Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
          ), // Random date within last 60 days
        },
      });
      posts.push(post);
    }

    // Create 15-20 posts from fan users
    const numFanPosts = Math.floor(Math.random() * 6) + 15; // 15-20 posts
    for (let i = 0; i < numFanPosts; i++) {
      const fan = fans[Math.floor(Math.random() * fans.length)];
      // Get a community that this fan follows (if any)
      const fanFollows = followers.filter((f) => f.userId === fan.id);
      const communityId =
        fanFollows.length > 0
          ? fanFollows[Math.floor(Math.random() * fanFollows.length)]
              .communityId
          : null;

      const post = await prisma.post.create({
        data: {
          content:
            fanPostContents[Math.floor(Math.random() * fanPostContents.length)],
          authorId: fan.id,
          communityId: communityId,
          mediaUrls: getRandomMediaUrls(),
          likeCount: 0, // Will be updated later
          commentCount: 0, // Will be updated later
          viewCount: 0, // Will be updated later
          createdAt: new Date(
            Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
          ), // Random date within last 60 days
        },
      });
      posts.push(post);
    }
    console.log(
      `  ✅ Created ${posts.length} posts (${numIdolPosts} from idols, ${numFanPosts} from fans)\n`,
    );

    // 10. Create Comments
    console.log('💬 Creating comments...');
    const comments: any[] = [];
    const commentTexts = [
      'Amazing! 😍',
      'Love this so much!',
      'You look beautiful! ✨',
      "Can't wait!",
      'This is incredible!',
      'So talented! 💕',
      'Best idol ever!',
      'Thank you for sharing!',
      'This made my day!',
      'Absolutely stunning!',
      'You inspire me so much!',
      'Keep up the great work!',
      'We love you! ❤️',
      'This is everything!',
      'So proud of you!',
    ];

    // Create 40-50 comments on random posts
    const numComments = Math.floor(Math.random() * 11) + 40; // 40-50 comments
    for (let i = 0; i < numComments; i++) {
      const post = posts[Math.floor(Math.random() * posts.length)];
      const allUsers = [adminUser, ...idols, ...fans];
      const commenter = allUsers[Math.floor(Math.random() * allUsers.length)];

      const comment = await prisma.comment.create({
        data: {
          content:
            commentTexts[Math.floor(Math.random() * commentTexts.length)],
          postId: post.id,
          userId: commenter.id,
          createdAt: new Date(
            post.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000,
          ), // After post creation
        },
      });
      comments.push(comment);
    }
    console.log(`  ✅ Created ${comments.length} comments\n`);

    // 11. Create Post Likes
    console.log('❤️ Creating post likes...');
    const postLikes: any[] = [];

    // Each fan likes 5-10 random posts
    for (const fan of fans) {
      const numLikes = Math.floor(Math.random() * 6) + 5; // 5-10 likes
      const shuffledPosts = [...posts].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numLikes, shuffledPosts.length); i++) {
        try {
          const like = await prisma.postLike.create({
            data: {
              postId: shuffledPosts[i].id,
              userId: fan.id,
            },
          });
          postLikes.push(like);
        } catch (error) {
          // Skip if duplicate
        }
      }
    }
    console.log(`  ✅ Created ${postLikes.length} post likes\n`);

    // 12. Create Post Views
    console.log('👁️ Creating post views...');
    const postViews: any[] = [];

    // Each user views 10-20 random posts
    const allUsers = [adminUser, ...idols, ...fans];
    for (const user of allUsers) {
      const numViews = Math.floor(Math.random() * 11) + 10; // 10-20 views
      const shuffledPosts = [...posts].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numViews, shuffledPosts.length); i++) {
        try {
          const view = await prisma.postView.create({
            data: {
              postId: shuffledPosts[i].id,
              userId: user.id,
            },
          });
          postViews.push(view);
        } catch (error) {
          // Skip if duplicate
        }
      }
    }
    console.log(`  ✅ Created ${postViews.length} post views\n`);

    // 13. Update Post Counts
    console.log('🔄 Updating post counts based on actual data...');
    let updatedPostsCount = 0;
    for (const post of posts) {
      // Count actual likes for this post
      const actualLikeCount = await prisma.postLike.count({
        where: { postId: post.id },
      });

      // Count actual comments for this post
      const actualCommentCount = await prisma.comment.count({
        where: { postId: post.id },
      });

      // Count actual views for this post
      const actualViewCount = await prisma.postView.count({
        where: { postId: post.id },
      });

      // Update the post with actual counts
      await prisma.post.update({
        where: { id: post.id },
        data: {
          likeCount: actualLikeCount,
          commentCount: actualCommentCount,
          viewCount: actualViewCount,
        },
      });
      updatedPostsCount++;
    }
    console.log(`  ✅ Updated counts for ${updatedPostsCount} posts\n`);

    // 14. Create Social Accounts (some users have Google/Facebook login)
    console.log('🔗 Creating social account links...');
    const socialAccounts: any[] = [];

    // Link 5 random fans to Google accounts
    for (let i = 0; i < 5; i++) {
      const socialAccount = await prisma.socialAccount.create({
        data: {
          provider: 'GOOGLE',
          providerId: `google_${Date.now()}_${i}`,
          userId: fans[i].id,
        },
      });
      socialAccounts.push(socialAccount);
    }

    // Link 3 random fans to Facebook accounts
    for (let i = 0; i < 3; i++) {
      const socialAccount = await prisma.socialAccount.create({
        data: {
          provider: 'FACEBOOK',
          providerId: `facebook_${Date.now()}_${i}`,
          userId: fans[i + 5].id,
        },
      });
      socialAccounts.push(socialAccount);
    }
    console.log(`  ✅ Created ${socialAccounts.length} social account links\n`);

    // Print Summary
    console.log('\n📊 Mock Data Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`👤 Users: ${1 + idols.length + fans.length} total`);
    console.log(`   - 1 Admin`);
    console.log(`   - ${idols.length} Idols`);
    console.log(`   - ${fans.length} Fans`);
    console.log(`🏘️  Communities: ${communities.length}`);
    console.log(`💙 Community Follows: ${followers.length}`);
    console.log(`💬 Chat Channels: ${chatChannels.length}`);
    console.log(
      `   - ${chatChannels.filter((c) => c.type === 'ANNOUNCEMENT').length} Announcement channels`,
    );
    console.log(
      `   - ${chatChannels.filter((c) => c.type === 'GROUP').length} Group channels`,
    );
    console.log(
      `   - ${chatChannels.filter((c) => c.type === 'DIRECT').length} Direct message channels`,
    );
    console.log(`👥 Chat Participants: ${participants.length}`);
    console.log(`💬 Chat Messages: ${messages.length}`);
    console.log(`📝 Posts: ${posts.length} (with accurate counts)`);
    console.log(`💬 Comments: ${comments.length}`);
    console.log(`❤️ Post Likes: ${postLikes.length}`);
    console.log(`👁️ Post Views: ${postViews.length}`);
    console.log(`🔗 Social Accounts: ${socialAccounts.length}`);
    console.log('═══════════════════════════════════════\n');

    console.log('📋 Test Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('Admin Account:');
    console.log('  Email: admin@ventidole.com');
    console.log('  Password: admin123\n');
    console.log('Idol Accounts (password: admin123):');
    idolData.forEach((idol) => {
      console.log(`  - ${idol.email} (${idol.username})`);
    });
    console.log('\nFan Accounts (password: admin123):');
    console.log('  - fan1@ventidole.com to fan15@ventidole.com');
    console.log('═══════════════════════════════════════\n');

    console.log('✅ Mock data seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedMockData()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
