import 'dotenv/config';
import { StreamChat } from 'stream-chat';

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

async function wipeGetStreamData() {
  try {
    console.log('🧹 Starting to wipe ALL data from GetStream...\n');
    console.log('⚠️  WARNING: This will delete ALL channels and users from GetStream!');
    console.log('   This operation cannot be undone.\n');

    if (!streamChatClient) {
      console.error('❌ Stream Chat client not initialized');
      process.exit(1);
    }

    // 1. Query and delete all channels
    console.log('📖 Querying all channels from GetStream...');
    let allChannels: any[] = [];
    let channelsDeleted = 0;
    let channelsFailed = 0;

    try {
      // Query all channels (limit 100 at a time, GetStream's max)
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await retryWithBackoff(async () => {
          if (!streamChatClient)
            throw new Error('Stream client not initialized');
          return await streamChatClient.queryChannels(
            {}, // Empty filter to get all channels
            { created_at: -1 }, // Sort by creation date descending
            { limit, offset },
          );
        });

        allChannels = allChannels.concat(response);
        console.log(
          `  ✅ Found ${response.length} channels (total: ${allChannels.length})`,
        );

        if (response.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
          await delay(500); // Rate limit protection
        }
      }

      console.log(`\n🗑️  Deleting ${allChannels.length} channels from GetStream...`);

      for (const channel of allChannels) {
        try {
          await retryWithBackoff(async () => {
            await channel.delete();
          });
          channelsDeleted++;
          console.log(`  ✅ Deleted channel: ${channel.id} (${channel.data?.name || 'Unnamed'})`);
          // Add delay to avoid rate limits
          await delay(500);
        } catch (error) {
          channelsFailed++;
          console.log(
            `  ⚠️  Warning: Could not delete channel ${channel.id}`,
          );
          console.log(
            `     Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      console.log(
        `\n  📊 Deleted ${channelsDeleted}/${allChannels.length} channels (${channelsFailed} failed)\n`,
      );
    } catch (error) {
      console.error('❌ Error querying/deleting channels:', error);
    }

    // 2. Query and delete all users
    console.log('📖 Querying all users from GetStream...');
    let allUsers: any[] = [];
    let usersDeleted = 0;
    let usersFailed = 0;

    try {
      // Query all users using ID-based pagination (to avoid offset limit of 1000)
      // We'll delete users as we find them to avoid memory issues
      const limit = 100;
      let batchNumber = 0;

      while (true) {
        batchNumber++;
        console.log(`  📦 Fetching batch ${batchNumber}...`);

        const response = await retryWithBackoff(async () => {
          if (!streamChatClient)
            throw new Error('Stream client not initialized');

          // Query users with small batches and no offset
          return await streamChatClient.queryUsers(
            {}, // Empty filter to get all users
            { created_at: -1 }, // Sort by creation date descending
            { limit, offset: 0 }, // Always offset 0 since we're deleting
          );
        });

        if (response.users.length === 0) {
          console.log(`  ✅ No more users found\n`);
          break;
        }

        console.log(`  ✅ Found ${response.users.length} users in batch ${batchNumber}`);
        allUsers = allUsers.concat(response.users);

        // Delete users immediately from this batch
        console.log(`  🗑️  Deleting batch ${batchNumber}...`);
        for (const user of response.users) {
          try {
            await retryWithBackoff(async () => {
              if (!streamChatClient)
                throw new Error('Stream client not initialized');
              await streamChatClient.deleteUser(user.id, {
                mark_messages_deleted: true,
                hard_delete: true,
              });
            });
            usersDeleted++;
            console.log(`    ✅ Deleted user: ${user.id} (${user.name || 'Unnamed'})`);
            // Add delay to avoid rate limits
            await delay(500);
          } catch (error) {
            usersFailed++;
            console.log(`    ⚠️  Warning: Could not delete user ${user.id}`);
            console.log(
              `       Error: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }

        console.log(`  📊 Batch ${batchNumber} complete: ${usersDeleted} deleted, ${usersFailed} failed\n`);

        // If we got fewer users than the limit, we're done
        if (response.users.length < limit) {
          console.log(`  ✅ All users processed\n`);
          break;
        }

        await delay(1000); // Longer delay between batches
      }

      console.log(`\n📊 Total: Deleted ${usersDeleted}/${allUsers.length} users (${usersFailed} failed)\n`);
    } catch (error) {
      console.error('❌ Error querying/deleting users:', error);
    }

    // 3. Summary
    console.log('📊 Wipe Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`💬 Total channels found: ${allChannels.length}`);
    console.log(`   - Deleted: ${channelsDeleted}`);
    console.log(`   - Failed: ${channelsFailed}`);
    console.log(`👤 Total users found: ${allUsers.length}`);
    console.log(`   - Deleted: ${usersDeleted}`);
    console.log(`   - Failed: ${usersFailed}`);
    console.log('═══════════════════════════════════════\n');

    if (channelsFailed > 0 || usersFailed > 0) {
      console.log('⚠️  Some items could not be deleted. This may be normal if:');
      console.log('   - Rate limits were exceeded');
      console.log('   - Items were already being deleted\n');
    }

    console.log('✅ GetStream wipe completed!\n');
    console.log('💡 To re-seed GetStream data, run:');
    console.log('   npx tsx scripts/seed-getstream.ts\n');
  } catch (error) {
    console.error('❌ Error during wipe:', error);
    throw error;
  }
}

// Run the wipe
wipeGetStreamData()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
