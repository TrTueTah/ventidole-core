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
    console.log('🌱 Starting GetStream sync from database...\n');

    // 1. Read users from database
    console.log('📖 Reading users from database...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        role: true,
      },
    });
    console.log(`  ✅ Found ${allUsers.length} users\n`);

    // 2. Create users in GetStream
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
        console.log(
          `  ⚠️  Warning: Could not create user ${user.id} in Stream Chat`,
        );
        console.log(
          `     Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    console.log(
      `  ✅ Created ${streamUsersCreated}/${allUsers.length} users in GetStream\n`,
    );

    // 3. Get admin user for channel creation
    console.log('📖 Finding admin user...');
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (!adminUser) {
      console.log('❌ No admin user found - cannot create channels');
      process.exit(1);
    }
    console.log(`  ✅ Found admin user: ${adminUser.email}\n`);

    // 4. Read channels from database
    console.log('📖 Reading channels from database...');
    const channels = await prisma.chatChannel.findMany({
      where: { isDeleted: false },
      include: {
        participants: {
          where: { isDeleted: false },
          select: {
            userId: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Found ${channels.length} channels\n`);

    // 5. Create channels in GetStream
    console.log('💬 Creating channels in GetStream...');
    let streamChannelsCreated = 0;

    for (const channel of channels) {
      try {
        // Use admin as the creator for all community channels
        const creatorId = adminUser.id;

        const streamChannel = streamChatClient!.channel(
          channel.type,
          channel.id,
          {
            created_by_id: creatorId,
            // Custom metadata stored in GetStream
            community_id: channel.communityId,
            is_community_channel: channel.isCommunityChannel || false,
          } as Record<string, unknown>,
        );
        await streamChannel.create();

        // Update channel with name and image after creation
        await streamChannel.update({
          name: channel.name || undefined,
          image: channel.image || undefined,
        } as Record<string, unknown>);

        streamChannelsCreated++;
        console.log(
          `  ✅ Created channel: ${channel.name} (${channel.id})`,
        );
        // Add delay to avoid rate limits
        await delay(250);
      } catch (error) {
        console.log(
          `    ⚠️  Warning: Could not create channel ${channel.id} in GetStream`,
        );
        console.log(
          `       Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    console.log(
      `  ✅ Created ${streamChannelsCreated}/${channels.length} channels in GetStream\n`,
    );

    // 6. Add participants to GetStream channels
    console.log('👤 Adding participants to GetStream channels...');
    let streamMembersAdded = 0;

    for (const channel of channels) {
      try {
        if (channel.participants.length === 0) continue;

        const memberIds = channel.participants.map((p) => p.userId);

        const streamChannel = streamChatClient!.channel(
          channel.type,
          channel.id,
        );

        // GetStream has a limit of 100 members per addMembers call
        // Split into batches of 100
        const batchSize = 100;
        for (let i = 0; i < memberIds.length; i += batchSize) {
          const batch = memberIds.slice(i, i + batchSize);
          await streamChannel.addMembers(batch);
          streamMembersAdded += batch.length;
          // Add delay to avoid rate limits
          await delay(250);
        }
        console.log(
          `  ✅ Added ${memberIds.length} members to channel ${channel.id}`,
        );
      } catch (error) {
        console.log(
          `    ⚠️  Warning: Could not add members to channel ${channel.id} in GetStream`,
        );
        console.log(
          `       Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    console.log(
      `  ✅ Added ${streamMembersAdded} total members to GetStream channels\n`,
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
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const channelParticipants = channel.participants;

      if (channelParticipants.length > 0) {
        const randomUserId =
          channelParticipants[
            Math.floor(Math.random() * channelParticipants.length)
          ].userId;

        try {
          const streamChannel = streamChatClient!.channel(
            channel.type,
            channel.id,
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
            `    ⚠️  Warning: Could not send message to channel ${channel.id}`,
          );
          console.log(
            `       Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
    console.log(`  ✅ Sent ${streamMessagesSent} messages to GetStream\n`);

    // Print Summary
    console.log('\n📊 GetStream Sync Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`👤 Users synced: ${streamUsersCreated}/${allUsers.length}`);
    console.log(`💬 Channels synced: ${streamChannelsCreated}/${channels.length}`);
    console.log(`👥 Members added: ${streamMembersAdded}`);
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
