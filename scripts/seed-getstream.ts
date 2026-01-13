import 'dotenv/config';
import { StreamChat } from 'stream-chat';
import { PrismaClient } from '../src/db/prisma/client';

const prisma = new PrismaClient();

// Helper function to add delay between API calls to avoid rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Initialize Stream Chat client
let streamChatClient: StreamChat | null = null;
if (process.env.STREAM_CHAT_API_KEY && process.env.STREAM_CHAT_SECRET) {
  streamChatClient = StreamChat.getInstance(
    process.env.STREAM_CHAT_API_KEY,
    process.env.STREAM_CHAT_SECRET,
  );
  console.log('✅ Stream Chat client initialized');
} else {
  console.log(
    '❌ Stream Chat not configured - missing STREAM_CHAT_API_KEY or STREAM_CHAT_SECRET',
  );
  process.exit(1);
}

async function seedGetStream() {
  try {
    console.log('🌱 Starting GetStream chat setup...\n');

    // 1. Create custom channel roles in GetStream
    console.log('🔧 Setting up custom channel roles...');
    const customRoles = [
      'moderator_member',
      'default_member',
      'trusted_member',
    ];

    for (const roleName of customRoles) {
      try {
        await streamChatClient!.createRole(roleName);
        console.log(`  ✅ Created role: ${roleName}`);
      } catch (error) {
        // Role might already exist, that's okay
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('already exists') ||
          errorMessage.includes('Role already exists')
        ) {
          console.log(`  ℹ️  Role ${roleName} already exists`);
        } else {
          console.log(`  ⚠️  Warning: Could not create role ${roleName}`);
          console.log(`     Error: ${errorMessage}`);
        }
      }
    }
    console.log('');

    // 2. Read users from database
    console.log('📖 Reading users from database...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        role: true,
        communityId: true,
      },
    });
    console.log(`  ✅ Found ${allUsers.length} users\n`);

    // 3. Create users in GetStream
    console.log('👥 Creating users in GetStream...');
    let streamUsersCreated = 0;

    for (const user of allUsers) {
      try {
        await streamChatClient!.upsertUser({
          id: user.id,
          name: user.username,
          image: user.avatarUrl || undefined,
        });
        streamUsersCreated++;
        // Add delay to avoid rate limits (300 calls/minute = ~200ms per call)
        await delay(250);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // If user was deleted, restore them first then upsert
        if (errorMessage.includes('was deleted')) {
          try {
            await streamChatClient!.restoreUsers([user.id]);
            await streamChatClient!.upsertUser({
              id: user.id,
              name: user.username,
              image: user.avatarUrl || undefined,
            });
            streamUsersCreated++;
            console.log(`  ✅ Restored and recreated user: ${user.username}`);
            await delay(250);
          } catch (restoreError) {
            console.log(`  ⚠️  Warning: Could not restore user ${user.id}`);
            console.log(
              `     Error: ${restoreError instanceof Error ? restoreError.message : String(restoreError)}`,
            );
          }
        } else {
          console.log(
            `  ⚠️  Warning: Could not create user ${user.id} in Stream Chat`,
          );
          console.log(`     Error: ${errorMessage}`);
        }
      }
    }
    console.log(
      `  ✅ Created ${streamUsersCreated}/${allUsers.length} users in GetStream\n`,
    );

    // 4. Get or create admin user for channel creation
    console.log('📖 Finding admin user...');
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log('  ℹ️  No admin user found - creating one...');

      // Import bcryptjs for password hashing
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      adminUser = await prisma.user.create({
        data: {
          email: 'admin@ventidole.com',
          username: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          isChooseCommunity: true,
        },
      });

      // Create admin user in GetStream
      try {
        await streamChatClient!.upsertUser({
          id: adminUser.id,
          name: adminUser.username,
          role: 'admin',
        });
        console.log(`  ✅ Created admin user in database and GetStream: ${adminUser.email}`);
      } catch (error) {
        console.log(`  ⚠️  Warning: Could not create admin in GetStream`);
        console.log(`     Error: ${error instanceof Error ? error.message : String(error)}`);
      }

      await delay(250);
    } else {
      console.log(`  ✅ Found admin user: ${adminUser.email}`);
    }
    console.log('');

    // 5. Read communities from database
    console.log('📖 Reading communities from database...');
    const communities = await prisma.community.findMany({
      where: { isDeleted: false },
      include: {
        idols: {
          where: { isDeleted: false },
          select: { id: true },
        },
        followers: {
          where: { isDeleted: false },
          select: { userId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Found ${communities.length} communities\n`);

    // 6. Create community channels in GetStream
    console.log('💬 Creating community channels in GetStream...');
    let streamChannelsCreated = 0;
    const createdChannelIds: string[] = [];

    for (const community of communities) {
      try {
        const channelId = `community_${community.id}`;

        // Create channel with community metadata
        const streamChannel = streamChatClient!.channel(
          'messaging',
          channelId,
          {
            name: `${community.name} Community`,
            image: community.avatarUrl || undefined,
            community_id: community.id,
            is_community_channel: true,
            created_by_id: adminUser.id,
            discoverable: true,
          } as Record<string, unknown>,
        );

        await streamChannel.create();

        // Admin is automatically the channel creator/owner, no need to add explicitly

        // Add all idols from the community as 'moderator_member' (custom role)
        // This gives them permissions to send messages and moderate
        if (community.idols.length > 0) {
          const idolIds = community.idols.map((idol) => idol.id);
          await streamChannel.addMembers(
            idolIds.map((idolId) => ({
              user_id: idolId,
              channel_role: 'moderator_member',
            })),
          );
        }

        // Add all followers with custom roles
        // 10% will be 'trusted_member' (can send messages)
        // 90% will be 'default_member' (readonly, no send permission)
        if (community.followers.length > 0) {
          const followerIds = community.followers.map((f) => f.userId);
          // Add in batches of 100
          const batchSize = 100;
          for (let i = 0; i < followerIds.length; i += batchSize) {
            const batch = followerIds.slice(i, i + batchSize);
            const membersWithRole = batch.map((userId) => {
              // 10% chance to be trusted_member
              const isTrusted = Math.random() < 0.1;
              return {
                user_id: userId,
                channel_role: isTrusted ? 'trusted_member' : 'default_member',
              };
            });
            await streamChannel.addMembers(membersWithRole);
            await delay(250);
          }
        }

        streamChannelsCreated++;
        createdChannelIds.push(channelId);
        console.log(
          `  ✅ Created channel: ${community.name} Community (${channelId})`,
        );
        console.log(`     - Admin: 1 member`);
        console.log(`     - Idols: ${community.idols.length} members`);
        console.log(`     - Followers: ${community.followers.length} members`);
        await delay(250);
      } catch (error) {
        console.log(
          `    ⚠️  Warning: Could not create channel for ${community.name}`,
        );
        console.log(
          `       Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    console.log(
      `  ✅ Created ${streamChannelsCreated}/${communities.length} channels in GetStream\n`,
    );

    // 7. Send sample messages to channels
    console.log('💬 Sending sample messages to GetStream...');
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
    let streamMessagesSent = 0;

    for (let i = 0; i < numMessages; i++) {
      if (createdChannelIds.length === 0) break;

      const channelId =
        createdChannelIds[Math.floor(Math.random() * createdChannelIds.length)];

      // Find the community for this channel
      const communityId = channelId.replace('community_', '');
      const community = communities.find((c) => c.id === communityId);

      if (community) {
        // Pick a random member (admin, idol, or follower)
        const allMembers = [
          adminUser.id,
          ...community.idols.map((i) => i.id),
          ...community.followers.map((f) => f.userId),
        ];

        if (allMembers.length > 0) {
          const randomUserId =
            allMembers[Math.floor(Math.random() * allMembers.length)];

          try {
            const streamChannel = streamChatClient!.channel(
              'messaging',
              channelId,
            );
            await streamChannel.sendMessage({
              text: messageTemplates[
                Math.floor(Math.random() * messageTemplates.length)
              ],
              user_id: randomUserId,
            } as Record<string, unknown>);
            streamMessagesSent++;
            // Add delay to avoid rate limits
            await delay(250);
          } catch (error) {
            console.log(
              `    ⚠️  Warning: Could not send message to channel ${channelId}`,
            );
            console.log(
              `       Error: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }
    }
    console.log(`  ✅ Sent ${streamMessagesSent} messages to GetStream\n`);

    // Print Summary
    console.log('\n📊 GetStream Sync Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`👤 Users synced: ${streamUsersCreated}/${allUsers.length}`);
    console.log(
      `💬 Channels created: ${streamChannelsCreated}/${communities.length}`,
    );
    console.log(`💬 Messages sent: ${streamMessagesSent}`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ GetStream sync completed successfully!\n');
  } catch (error) {
    console.error('❌ Error syncing GetStream:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedGetStream()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
