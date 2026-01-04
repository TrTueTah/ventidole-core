import 'dotenv/config';
import { StreamChat } from 'stream-chat';

async function cleanupStreamChannels() {
  try {
    console.log('🧹 Cleaning up GetStream channels...\n');

    const apiKey = process.env.STREAM_CHAT_API_KEY;
    const secret = process.env.STREAM_CHAT_SECRET;

    if (!apiKey || !secret) {
      console.error('❌ Missing STREAM_CHAT_API_KEY or STREAM_CHAT_SECRET');
      process.exit(1);
    }

    const client = StreamChat.getInstance(apiKey, secret);

    // Query all channels
    console.log('📋 Fetching all channels...');
    const channels = await client.queryChannels({}, [{ created_at: -1 }], {
      limit: 100,
    });

    console.log(`   Found ${channels.length} channels to delete\n`);

    // Delete each channel
    let deletedCount = 0;
    for (const channel of channels) {
      try {
        await channel.delete();
        deletedCount++;
        console.log(`   ✅ Deleted channel: ${channel.id}`);
      } catch (error) {
        console.error(
          `   ❌ Failed to delete channel ${channel.id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    console.log(
      `\n✅ Cleanup completed! Deleted ${deletedCount}/${channels.length} channels`,
    );
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupStreamChannels()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
