import 'dotenv/config';
import { StreamChat } from 'stream-chat';
import { PrismaClient } from '../src/db/prisma/client';

const prisma = new PrismaClient();

// Helper function to add delay between API calls to avoid rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if it's a rate limit error
      if (
        errorMessage.includes('Too many requests') ||
        errorMessage.includes('rate limit')
      ) {
        const delayMs = initialDelay * Math.pow(2, attempt);
        console.log(
          `    ⏳ Rate limited, waiting ${delayMs}ms before retry ${attempt + 1}/${maxRetries}...`,
        );
        await delay(delayMs);
      } else {
        // If it's not a rate limit error, don't retry
        throw error;
      }
    }
  }

  throw new Error(lastError?.message || 'Unknown error');
}

// Initialize Stream Chat client
let streamChatClient: StreamChat | null = null;
if (process.env.STREAM_CHAT_API_KEY && process.env.STREAM_CHAT_SECRET) {
  streamChatClient = StreamChat.getInstance(
    process.env.STREAM_CHAT_API_KEY,
    process.env.STREAM_CHAT_SECRET,
  );
  console.log('✅ Stream Chat client initialized');
} else {
  console.error(
    '❌ Stream Chat credentials not found. Please set STREAM_CHAT_API_KEY and STREAM_CHAT_SECRET',
  );
  process.exit(1);
}

async function cleanupStreamData() {
  try {
    console.log('🧹 Starting to cleanup GetStream data...\n');

    if (!streamChatClient) {
      console.error('❌ Stream Chat client not initialized');
      process.exit(1);
    }

    // 1. Read existing data from database and GetStream
    console.log('📖 Reading data from database and GetStream...');

    // Get communities to find their channels
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Found ${communities.length} communities`);

    // Build list of channel IDs based on community IDs
    const channelIds = communities.map((c) => `community_${c.id}`);

    const idols = await prisma.user.findMany({
      where: { role: 'IDOL' },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Found ${idols.length} idol accounts`);

    const fans = await prisma.user.findMany({
      where: { role: 'FAN' },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Found ${fans.length} fan accounts`);

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    console.log(`  ✅ Found admin user: ${adminUser?.email || 'N/A'}\n`);

    const allUsers = [...(adminUser ? [adminUser] : []), ...idols, ...fans];

    // 2. Delete channels from GetStream
    console.log('🗑️  Deleting channels from GetStream...');
    let channelsDeleted = 0;
    let channelsFailed = 0;

    for (const channelId of channelIds) {
      try {
        await retryWithBackoff(async () => {
          if (!streamChatClient)
            throw new Error('Stream client not initialized');
          const streamChannel = streamChatClient.channel('messaging', channelId);
          await streamChannel.delete();
        });
        channelsDeleted++;
        console.log(`  ✅ Deleted channel: ${channelId}`);
        // Add delay to avoid rate limits (500ms for safer rate limiting)
        await delay(500);
      } catch (error) {
        channelsFailed++;
        console.log(
          `  ⚠️  Warning: Could not delete channel ${channelId} from GetStream`,
        );
        console.log(
          `     Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    console.log(
      `  📊 Deleted ${channelsDeleted}/${channelIds.length} channels (${channelsFailed} failed)\n`,
    );

    // 3. Delete users from GetStream
    console.log('🗑️  Deleting users from GetStream...');
    let usersDeleted = 0;
    let usersFailed = 0;

    for (const user of allUsers) {
      try {
        // Delete user with hard delete option to completely remove from GetStream
        await retryWithBackoff(async () => {
          if (!streamChatClient)
            throw new Error('Stream client not initialized');
          await streamChatClient.deleteUser(user.id, {
            mark_messages_deleted: true,
            hard_delete: true,
          });
        });
        usersDeleted++;
        console.log(`  ✅ Deleted user: ${user.username} (${user.email})`);
        // Add delay to avoid rate limits (500ms for safer rate limiting)
        await delay(500);
      } catch (error) {
        usersFailed++;
        console.log(
          `  ⚠️  Warning: Could not delete user ${user.id} from GetStream`,
        );
        console.log(
          `     Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    console.log(
      `  📊 Deleted ${usersDeleted}/${allUsers.length} users (${usersFailed} failed)\n`,
    );

    // 4. Summary
    console.log('📊 Cleanup Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`💬 Channels deleted: ${channelsDeleted}/${channelIds.length}`);
    console.log(`👤 Users deleted: ${usersDeleted}/${allUsers.length}`);
    console.log('═══════════════════════════════════════\n');

    if (channelsFailed > 0 || usersFailed > 0) {
      console.log('⚠️  Some items could not be deleted. This may be normal if:');
      console.log('   - The items were already deleted');
      console.log('   - The items never existed in GetStream');
      console.log('   - Rate limits were exceeded\n');
    }

    console.log('✅ GetStream cleanup completed!\n');
    console.log('💡 Note: Chat channels, participants, and messages are stored');
    console.log('   only in GetStream (not in database). To re-seed, run:');
    console.log('   npm run seed:mock\n');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupStreamData()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
