import 'dotenv/config';
import { Knock } from '@knocklabs/node';

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

// Initialize Knock client
let knockClient: Knock | null = null;
if (process.env.KNOCK_SECRET_KEY) {
  knockClient = new Knock({ apiKey: process.env.KNOCK_SECRET_KEY });
  console.log('✅ Knock client initialized');
} else {
  console.error(
    '❌ Knock credentials not found. Please set KNOCK_SECRET_KEY',
  );
  process.exit(1);
}

async function wipeKnockData() {
  try {
    console.log('🧹 Starting to wipe ALL data from Knock...\n');
    console.log('⚠️  WARNING: This will delete ALL users from Knock!');
    console.log('   This operation cannot be undone.\n');

    if (!knockClient) {
      console.error('❌ Knock client not initialized');
      process.exit(1);
    }

    let allUsers: any[] = [];
    let usersDeleted = 0;
    let usersFailed = 0;

    // 1. Query and delete all users
    console.log('📖 Querying all users from Knock...');

    try {
      // Knock uses cursor-based pagination
      let hasMore = true;
      let after: string | undefined = undefined;
      let batchNumber = 0;

      while (hasMore) {
        batchNumber++;
        console.log(`  📦 Fetching batch ${batchNumber}...`);

        const response = await retryWithBackoff(async () => {
          if (!knockClient) throw new Error('Knock client not initialized');

          const params: any = { limit: 50 };
          if (after) {
            params.after = after;
          }

          return await knockClient.users.list(params);
        });

        if (response.entries && response.entries.length > 0) {
          allUsers = allUsers.concat(response.entries);
          console.log(
            `  ✅ Found ${response.entries.length} users (total: ${allUsers.length})`,
          );

          // Delete users immediately from this batch
          console.log(`  🗑️  Deleting batch ${batchNumber}...`);
          for (const user of response.entries) {
            try {
              await retryWithBackoff(async () => {
                if (!knockClient)
                  throw new Error('Knock client not initialized');
                await knockClient.users.delete(user.id);
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

          console.log(
            `  📊 Batch ${batchNumber} complete: ${usersDeleted} deleted, ${usersFailed} failed\n`,
          );

          // Check if there are more pages
          if (response.page_info && response.page_info.after) {
            after = response.page_info.after;
            await delay(1000); // Longer delay between batches
          } else {
            hasMore = false;
          }
        } else {
          console.log(`  ✅ No more users found\n`);
          hasMore = false;
        }
      }

      console.log(
        `\n📊 Total: Deleted ${usersDeleted}/${allUsers.length} users (${usersFailed} failed)\n`,
      );
    } catch (error) {
      console.error('❌ Error querying/deleting users:', error);
    }

    // 2. Summary
    console.log('📊 Wipe Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`👤 Total users found: ${allUsers.length}`);
    console.log(`   - Deleted: ${usersDeleted}`);
    console.log(`   - Failed: ${usersFailed}`);
    console.log('═══════════════════════════════════════\n');

    if (usersFailed > 0) {
      console.log('⚠️  Some users could not be deleted. This may be normal if:');
      console.log('   - Rate limits were exceeded');
      console.log('   - Users were already being deleted\n');
    }

    console.log('✅ Knock wipe completed!\n');
    console.log('💡 To re-seed Knock data, run:');
    console.log('   npm run seed:knock\n');
  } catch (error) {
    console.error('❌ Error during wipe:', error);
    throw error;
  }
}

// Run the wipe
wipeKnockData()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
