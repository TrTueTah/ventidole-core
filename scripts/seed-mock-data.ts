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
    await prisma.community.createMany({
      data: [
        {
          name: 'BLACKPINK',
          avatarUrl: 'https://i.pravatar.cc/300?img=20',
          backgroundUrl: 'https://picsum.photos/1200/400?random=2',
          description: 'K-pop girl group formed by YG Entertainment',
        },
        {
          name: 'BTS',
          avatarUrl: 'https://i.pravatar.cc/300?img=21',
          backgroundUrl: 'https://picsum.photos/1200/400?random=3',
          description: 'Korean boy band formed by Big Hit Entertainment',
        },
        {
          name: 'TWICE',
          avatarUrl: 'https://i.pravatar.cc/300?img=22',
          backgroundUrl: 'https://picsum.photos/1200/400?random=4',
          description: 'K-pop girl group formed by JYP Entertainment',
        },
      ],
    });
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: 'asc' },
      take: 3,
    });
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

    await prisma.user.createMany({
      data: idolData.map((data, i) => ({
        email: data.email,
        password: hashedPassword,
        username: data.username.toLowerCase(),
        role: 'IDOL',
        bio: data.bio,
        communityId: data.communityId,
        avatarUrl: `https://i.pravatar.cc/150?img=${10 + i}`,
        backgroundUrl: `https://picsum.photos/1200/400?random=${10 + i}`,
      })),
    });
    const idols = await prisma.user.findMany({
      where: { role: 'IDOL' },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${idols.length} idol accounts\n`);

    // 4. Create Fan Users
    console.log('👥 Creating fan users...');
    await prisma.user.createMany({
      data: Array.from({ length: 15 }, (_, i) => ({
        email: `fan${i + 1}@ventidole.com`,
        password: hashedPassword,
        username: `fan${i + 1}`,
        role: 'FAN',
        avatarUrl: `https://i.pravatar.cc/150?img=${30 + i}`,
        backgroundUrl: `https://picsum.photos/1200/400?random=${30 + i}`,
      })),
    });
    const fans = await prisma.user.findMany({
      where: { role: 'FAN' },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${fans.length} fan accounts\n`);

    // 5. Create Community Followers (Fans follow communities)
    console.log('💙 Creating community followers...');
    const followersData: Array<{ userId: string; communityId: string }> = [];

    // Each fan follows 1-3 random communities
    for (const fan of fans) {
      const numFollows = Math.floor(Math.random() * 3) + 1; // 1-3 communities
      const shuffledCommunities = [...communities].sort(
        () => Math.random() - 0.5,
      );

      for (let i = 0; i < numFollows; i++) {
        followersData.push({
          userId: fan.id,
          communityId: shuffledCommunities[i].id,
        });
      }
    }

    await prisma.communityFollower.createMany({
      data: followersData,
    });
    const followers = await prisma.communityFollower.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${followers.length} community follows\n`);

    // 6. Create Chat Channels
    console.log('💬 Creating chat channels...');
    const chatChannelsData = [
      // Create announcement channels for each community
      ...communities.map((community) => ({
        name: `${community.name} Official Announcements`,
        description: `Official announcements from ${community.name}`,
        communityId: community.id,
      })),
      // Create group chat for each community
      ...communities.map((community) => ({
        name: `${community.name} Fan Club`,
        description: `General chat for ${community.name} fans`,
        communityId: community.id,
      })),
      // Create direct message channels for each idol
      ...idols.map((idol) => ({
        name: `DM with ${idol.username}`,
        description: `Direct messages with ${idol.username}`,
        idolId: idol.id,
      })),
    ];

    await prisma.chatChannel.createMany({
      data: chatChannelsData,
    });
    const chatChannels = await prisma.chatChannel.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${chatChannels.length} chat channels\n`);

    // 7. Create Chat Participants
    console.log('👤 Adding chat participants...');
    const participantsData: Array<{
      channelId: string;
      userId: string;
      canSendMessage: boolean;
    }> = [];

    // Add fans to community group chats (only if they follow the community)
    for (const follower of followers) {
      const communityGroupChat = chatChannels.find(
        (ch) => ch.communityId === follower.communityId && !ch.idolId,
      );

      if (communityGroupChat) {
        participantsData.push({
          channelId: communityGroupChat.id,
          userId: follower.userId,
          canSendMessage: true,
        });
      }
    }

    // Add idols to their community channels
    for (const idol of idols) {
      const communityChannels = chatChannels.filter(
        (ch) => ch.communityId === idol.communityId,
      );

      for (const channel of communityChannels) {
        participantsData.push({
          channelId: channel.id,
          userId: idol.id,
          canSendMessage: true,
        });
      }
    }

    await prisma.chatParticipant.createMany({
      data: participantsData,
    });
    const participants = await prisma.chatParticipant.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${participants.length} chat participants\n`);

    // 8. Create Chat Messages
    console.log('💬 Creating chat messages...');
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
    const messagesData: Array<{
      content: string;
      channelId: string;
      userId: string;
      createdAt: Date;
    }> = [];

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
        messagesData.push({
          content:
            messageTemplates[
              Math.floor(Math.random() * messageTemplates.length)
            ],
          channelId: channel.id,
          userId: participant.userId,
          createdAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ), // Random date within last 30 days
        });
      }
    }

    await prisma.chatMessage.createMany({
      data: messagesData,
    });
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${messages.length} chat messages\n`);

    // 9. Create Posts
    console.log('📝 Creating posts...');
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
    const idolPostsData = Array.from({ length: numIdolPosts }, () => {
      const idol = idols[Math.floor(Math.random() * idols.length)];
      return {
        content:
          idolPostContents[Math.floor(Math.random() * idolPostContents.length)],
        authorId: idol.id,
        communityId: idol.communityId!,
        mediaUrls: getRandomMediaUrls(),
        likeCount: 0, // Will be updated later
        commentCount: 0, // Will be updated later
        viewCount: 0, // Will be updated later
        createdAt: new Date(
          Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
        ), // Random date within last 60 days
      };
    });

    // Create 15-20 posts from fan users
    const numFanPosts = Math.floor(Math.random() * 6) + 15; // 15-20 posts
    const fanPostsData = Array.from({ length: numFanPosts }, () => {
      const fan = fans[Math.floor(Math.random() * fans.length)];
      // Get a community that this fan follows (if any)
      const fanFollows = followers.filter((f) => f.userId === fan.id);
      const communityId =
        fanFollows.length > 0
          ? fanFollows[Math.floor(Math.random() * fanFollows.length)]
              .communityId
          : communities[0].id; // Default to first community if fan doesn't follow any

      return {
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
      };
    });

    await prisma.post.createMany({
      data: [...idolPostsData, ...fanPostsData],
    });
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(
      `  ✅ Created ${posts.length} posts (${numIdolPosts} from idols, ${numFanPosts} from fans)\n`,
    );

    // 10. Create Comments
    console.log('💬 Creating comments...');
    const allUsers = [adminUser, ...idols, ...fans];
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
    const commentsData = Array.from({ length: numComments }, () => {
      const post = posts[Math.floor(Math.random() * posts.length)];
      const commenter = allUsers[Math.floor(Math.random() * allUsers.length)];

      return {
        content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
        postId: post.id,
        userId: commenter.id,
        createdAt: new Date(
          post.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000,
        ), // After post creation
      };
    });

    await prisma.comment.createMany({
      data: commentsData,
    });
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${comments.length} comments\n`);

    // 11. Create Post Likes
    console.log('❤️ Creating post likes...');
    const postLikesData: Array<{ postId: string; userId: string }> = [];

    // Each fan likes 5-10 random posts
    for (const fan of fans) {
      const numLikes = Math.floor(Math.random() * 6) + 5; // 5-10 likes
      const shuffledPosts = [...posts].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numLikes, shuffledPosts.length); i++) {
        postLikesData.push({
          postId: shuffledPosts[i].id,
          userId: fan.id,
        });
      }
    }

    await prisma.postLike.createMany({
      data: postLikesData,
      skipDuplicates: true,
    });
    const postLikes = await prisma.postLike.findMany();
    console.log(`  ✅ Created ${postLikes.length} post likes\n`);

    // 12. Create Post Views
    console.log('👁️ Creating post views...');
    const postViewsData: Array<{ postId: string; userId: string }> = [];

    // Each user views 10-20 random posts
    for (const user of allUsers) {
      const numViews = Math.floor(Math.random() * 11) + 10; // 10-20 views
      const shuffledPosts = [...posts].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numViews, shuffledPosts.length); i++) {
        postViewsData.push({
          postId: shuffledPosts[i].id,
          userId: user.id,
        });
      }
    }

    await prisma.postView.createMany({
      data: postViewsData,
      skipDuplicates: true,
    });
    const postViews = await prisma.postView.findMany();
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
    const socialAccountsData = [
      // Link 5 random fans to Google accounts
      ...Array.from({ length: 5 }, (_, i) => ({
        provider: 'GOOGLE' as const,
        providerId: `google_${Date.now()}_${i}`,
        userId: fans[i].id,
      })),
      // Link 3 random fans to Facebook accounts
      ...Array.from({ length: 3 }, (_, i) => ({
        provider: 'FACEBOOK' as const,
        providerId: `facebook_${Date.now()}_${i}`,
        userId: fans[i + 5].id,
      })),
    ];

    await prisma.socialAccount.createMany({
      data: socialAccountsData,
    });
    const socialAccounts = await prisma.socialAccount.findMany();
    console.log(`  ✅ Created ${socialAccounts.length} social account links\n`);

    // 15. Create Product Types
    console.log('🏷️  Creating product types...');
    await prisma.productType.createMany({
      data: [
        { name: 'Album' },
        { name: 'Merchandise' },
        { name: 'Photocard' },
        { name: 'Poster' },
        { name: 'Apparel' },
        { name: 'Accessories' },
      ],
    });
    const productTypes = await prisma.productType.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${productTypes.length} product types\n`);

    // 16. Create Shops for Communities
    console.log('🏪 Creating shops for communities...');
    await prisma.shop.createMany({
      data: communities.map((community) => ({
        communityId: community.id,
        name: `${community.name} Official Shop`,
        description: `Official merchandise and exclusive items from ${community.name}`,
        avatarUrl: community.avatarUrl,
      })),
    });
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${shops.length} shops\n`);

    // 17. Create Products
    console.log('🛍️  Creating products...');
    const productTemplates = [
      {
        name: 'Signed Album',
        description: 'Limited edition signed album with exclusive photocard',
        price: 45.99,
        stock: 50,
        typeIndex: 0, // Album
        mediaUrls: [
          'https://res.cloudinary.com/dsc9afexw/image/upload/v1762054385/kt1-6905e9f7e7ad5_z2wfqq.jpg',
        ],
      },
      {
        name: 'Official T-Shirt',
        description: 'Premium cotton t-shirt with exclusive design',
        price: 29.99,
        stock: 100,
        typeIndex: 4, // Apparel
        mediaUrls: [
          'https://res.cloudinary.com/dsc9afexw/image/upload/v1758008644/iK-Cji6J73Q-HD_nmbkfm.jpg',
        ],
      },
      {
        name: 'Photocard Set',
        description: 'Collectible photocard set (5 cards)',
        price: 15.99,
        stock: 200,
        typeIndex: 2, // Photocard
        mediaUrls: [
          'https://res.cloudinary.com/dsc9afexw/image/upload/v1762853124/273532258_1528902877562442_6813889931345818717_n_bqaajl.webp',
        ],
      },
      {
        name: 'Concert Poster',
        description: 'High-quality poster from latest concert tour',
        price: 19.99,
        stock: 75,
        typeIndex: 3, // Poster
        mediaUrls: availableMediaUrls,
      },
      {
        name: 'Light Stick',
        description: 'Official light stick for concerts and events',
        price: 55.99,
        stock: 80,
        typeIndex: 1, // Merchandise
        mediaUrls: [availableMediaUrls[0]],
      },
      {
        name: 'Hoodie',
        description: 'Comfortable hoodie with embroidered logo',
        price: 65.99,
        stock: 60,
        typeIndex: 4, // Apparel
        mediaUrls: [availableMediaUrls[1], availableMediaUrls[2]],
      },
      {
        name: 'Keychain',
        description: 'Metal keychain with exclusive design',
        price: 12.99,
        stock: 150,
        typeIndex: 5, // Accessories
        mediaUrls: [availableMediaUrls[2]],
      },
      {
        name: 'Phone Case',
        description: 'Protective phone case with exclusive artwork',
        price: 24.99,
        stock: 90,
        typeIndex: 5, // Accessories
        mediaUrls: [availableMediaUrls[0], availableMediaUrls[1]],
      },
    ];

    // Create 3-5 products for each shop
    const productsData: Array<{
      shopId: string;
      name: string;
      description: string;
      price: number;
      stock: number;
      typeId: string;
      mediaUrls: string[];
    }> = [];

    for (const shop of shops) {
      const numProducts = Math.floor(Math.random() * 3) + 3; // 3-5 products
      const shuffledTemplates = [...productTemplates].sort(
        () => Math.random() - 0.5,
      );

      for (let i = 0; i < numProducts; i++) {
        const template = shuffledTemplates[i];
        productsData.push({
          shopId: shop.id,
          name: template.name,
          description: template.description,
          price: template.price,
          stock: template.stock,
          typeId: productTypes[template.typeIndex].id,
          mediaUrls: template.mediaUrls,
        });
      }
    }

    await prisma.product.createMany({
      data: productsData,
    });
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${products.length} products\n`);

    // 18. Create Product Variants
    console.log('🎨 Creating product variants...');

    // Add variants for apparel products (t-shirts, hoodies)
    const apparelProducts = products.filter((p) => {
      const type = productTypes.find((pt) => pt.id === p.typeId);
      return type?.name === 'Apparel';
    });

    const sizes = ['S', 'M', 'L', 'XL'];
    const productVariantsData = apparelProducts.flatMap((product) =>
      sizes.map((size) => ({
        name: `Size ${size}`,
        price: product.price,
        stock: Math.floor(product.stock / sizes.length),
        productId: product.id,
      })),
    );

    await prisma.productVariant.createMany({
      data: productVariantsData,
    });
    const productVariants = await prisma.productVariant.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${productVariants.length} product variants\n`);

    // 19. Create Carts for Fans
    console.log('🛒 Creating carts...');
    await prisma.cart.createMany({
      data: fans.map((fan) => ({
        userId: fan.id,
      })),
    });
    const carts = await prisma.cart.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${carts.length} carts\n`);

    // 20. Create Cart Items (some fans have items in cart)
    console.log('🛍️  Adding items to carts...');
    const cartItemsData: Array<{
      cartId: string;
      productId: string;
      variantId?: string;
      quantity: number;
    }> = [];

    // 5-8 random fans have items in their cart
    const numFansWithItems = Math.floor(Math.random() * 4) + 5; // 5-8 fans
    const fansWithCarts = [...fans]
      .sort(() => Math.random() - 0.5)
      .slice(0, numFansWithItems);

    for (const fan of fansWithCarts) {
      const cart = carts.find((c) => c.userId === fan.id);
      if (!cart) continue;

      const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const shuffledProducts = [...products].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numItems; i++) {
        const product = shuffledProducts[i];
        // Check if this product has variants
        const productVariantsForProduct = productVariants.filter(
          (v) => v.productId === product.id,
        );
        const variant =
          productVariantsForProduct.length > 0
            ? productVariantsForProduct[
                Math.floor(Math.random() * productVariantsForProduct.length)
              ]
            : undefined;

        cartItemsData.push({
          cartId: cart.id,
          productId: product.id,
          variantId: variant?.id,
          quantity: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
        });
      }
    }

    await prisma.cartItem.createMany({
      data: cartItemsData,
    });
    const cartItems = await prisma.cartItem.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Created ${cartItems.length} cart items\n`);

    // 21. Create Orders - SKIPPED
    // console.log('📦 Creating orders...');
    // const orderStatuses: Array<
    //   'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled' | 'refunded'
    // > = ['pending', 'paid', 'shipping', 'delivered', 'cancelled', 'refunded'];

    // // Create 15-20 orders
    // const numOrders = Math.floor(Math.random() * 6) + 15; // 15-20 orders
    // const ordersData = Array.from({ length: numOrders }, () => {
    //   const fan = fans[Math.floor(Math.random() * fans.length)];
    //   const status =
    //     orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    //   const createdDate = new Date(
    //     Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
    //   ); // Random date within last 90 days

    //   return {
    //     userId: fan.id,
    //     totalAmount: 0, // Will be calculated based on order items
    //     status: status,
    //     shippingAddress: {
    //       street: '123 K-Pop Street',
    //       city: 'Seoul',
    //       state: 'Seoul',
    //       zipCode: '12345',
    //       country: 'South Korea',
    //     },
    //     paymentMethod: Math.random() > 0.5 ? 'credit_card' : 'paypal',
    //     paidAt:
    //       status === 'paid' ||
    //       status === 'shipping' ||
    //       status === 'delivered' ||
    //       status === 'refunded'
    //         ? new Date(createdDate.getTime() + 60 * 60 * 1000) // 1 hour after creation
    //         : null,
    //     createdAt: createdDate,
    //   };
    // });

    // await prisma.order.createMany({
    //   data: ordersData,
    // });
    // const orders = await prisma.order.findMany({
    //   orderBy: { createdAt: 'asc' },
    // });
    // console.log(`  ✅ Created ${orders.length} orders\n`);

    // // 22. Create Order Items
    // console.log('📋 Creating order items...');
    // const orderItemsData: Array<{
    //   orderId: string;
    //   productId: string;
    //   variantId?: string;
    //   price: number;
    //   quantity: number;
    // }> = [];
    // const orderTotals: Map<string, number> = new Map();

    // for (const order of orders) {
    //   const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
    //   const shuffledProducts = [...products].sort(() => Math.random() - 0.5);
    //   let orderTotal = 0;

    //   for (let i = 0; i < numItems; i++) {
    //     const product = shuffledProducts[i];
    //     const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
    //     const productVariantsForProduct = productVariants.filter(
    //       (v) => v.productId === product.id,
    //     );
    //     const variant =
    //       productVariantsForProduct.length > 0
    //         ? productVariantsForProduct[
    //             Math.floor(Math.random() * productVariantsForProduct.length)
    //           ]
    //         : undefined;

    //     const price = variant ? variant.price : product.price;
    //     orderTotal += price * quantity;

    //     orderItemsData.push({
    //       orderId: order.id,
    //       productId: product.id,
    //       variantId: variant?.id,
    //       price: price,
    //       quantity: quantity,
    //     });
    //   }

    //   orderTotals.set(order.id, orderTotal);
    // }

    // await prisma.orderItem.createMany({
    //   data: orderItemsData,
    // });
    // const orderItems = await prisma.orderItem.findMany({
    //   orderBy: { createdAt: 'asc' },
    // });

    // // Update order totals in batch
    // await prisma.$transaction(
    //   orders.map((order) =>
    //     prisma.order.update({
    //       where: { id: order.id },
    //       data: { totalAmount: orderTotals.get(order.id) || 0 },
    //     }),
    //   ),
    // );

    // // Refetch orders with updated totals
    // const updatedOrders = await prisma.order.findMany({
    //   orderBy: { createdAt: 'asc' },
    // });
    // console.log(`  ✅ Created ${orderItems.length} order items\n`);

    // // 23. Create Payment Transactions
    // console.log('💳 Creating payment transactions...');
    // const paymentTransactionsData = updatedOrders.map((order) => {
    //   // Determine payment transaction status based on order status
    //   let txnStatus: 'pending' | 'success' | 'failed' | 'refunded';
    //   if (order.status === 'pending' || order.status === 'cancelled') {
    //     txnStatus = Math.random() > 0.5 ? 'pending' : 'failed';
    //   } else if (order.status === 'refunded') {
    //     txnStatus = 'refunded';
    //   } else {
    //     txnStatus = 'success';
    //   }

    //   return {
    //     orderId: order.id,
    //     userId: order.userId,
    //     amount: order.totalAmount,
    //     provider: order.paymentMethod === 'credit_card' ? 'Stripe' : 'PayPal',
    //     providerTxnId:
    //       txnStatus !== 'pending'
    //         ? `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`
    //         : null,
    //     status: txnStatus,
    //     paidAt: order.paidAt,
    //     createdAt: order.createdAt,
    //   };
    // });

    // await prisma.paymentTransaction.createMany({
    //   data: paymentTransactionsData,
    // });
    // const paymentTransactions = await prisma.paymentTransaction.findMany();
    // console.log(
    //   `  ✅ Created ${paymentTransactions.length} payment transactions\n`,
    // );

    // Initialize empty arrays for skipped sections
    const orders: Array<{ id: string; status: string; userId: string }> = [];
    const orderItems: Array<{ id: string }> = [];
    const paymentTransactions: Array<{ status: string }> = [];

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
    const announcementChannels = chatChannels.filter(
      (_, idx) => idx < communities.length,
    );
    const groupChannels = chatChannels.filter(
      (_, idx) => idx >= communities.length && idx < communities.length * 2,
    );
    const directChannels = chatChannels.filter(
      (_, idx) => idx >= communities.length * 2,
    );
    console.log(`   - ${announcementChannels.length} Announcement channels`);
    console.log(`   - ${groupChannels.length} Group channels`);
    console.log(`   - ${directChannels.length} Direct message channels`);
    console.log(`👥 Chat Participants: ${participants.length}`);
    console.log(`💬 Chat Messages: ${messages.length}`);
    console.log(`📝 Posts: ${posts.length} (with accurate counts)`);
    console.log(`💬 Comments: ${comments.length}`);
    console.log(`❤️ Post Likes: ${postLikes.length}`);
    console.log(`👁️ Post Views: ${postViews.length}`);
    console.log(`🔗 Social Accounts: ${socialAccounts.length}`);
    console.log('\n🛍️  Marketplace:');
    console.log(`🏷️  Product Types: ${productTypes.length}`);
    console.log(`🏪 Shops: ${shops.length}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`🎨 Product Variants: ${productVariants.length}`);
    console.log(`🛒 Carts: ${carts.length}`);
    console.log(`🛍️  Cart Items: ${cartItems.length}`);
    console.log(`📦 Orders: ${orders.length}`);
    console.log(
      `   - Pending: ${orders.filter((o) => o.status === 'pending').length}`,
    );
    console.log(
      `   - Paid: ${orders.filter((o) => o.status === 'paid').length}`,
    );
    console.log(
      `   - Shipping: ${orders.filter((o) => o.status === 'shipping').length}`,
    );
    console.log(
      `   - Delivered: ${orders.filter((o) => o.status === 'delivered').length}`,
    );
    console.log(
      `   - Cancelled: ${orders.filter((o) => o.status === 'cancelled').length}`,
    );
    console.log(
      `   - Refunded: ${orders.filter((o) => o.status === 'refunded').length}`,
    );
    console.log(`📋 Order Items: ${orderItems.length}`);
    console.log(`💳 Payment Transactions: ${paymentTransactions.length}`);
    console.log(
      `   - Pending: ${paymentTransactions.filter((t) => t.status === 'pending').length}`,
    );
    console.log(
      `   - Success: ${paymentTransactions.filter((t) => t.status === 'success').length}`,
    );
    console.log(
      `   - Failed: ${paymentTransactions.filter((t) => t.status === 'failed').length}`,
    );
    console.log(
      `   - Refunded: ${paymentTransactions.filter((t) => t.status === 'refunded').length}`,
    );
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
