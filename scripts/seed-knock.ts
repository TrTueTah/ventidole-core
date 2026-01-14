import 'dotenv/config';
import { Knock } from '@knocklabs/node';
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

// Initialize Knock client
let knockClient: Knock | null = null;
const apiKey = process.env.KNOCK_SECRET_KEY || process.env.KNOCK_API_KEY;

if (apiKey) {
  knockClient = new Knock({ apiKey });
  console.log('✅ Knock client initialized');
} else {
  console.error(
    '❌ Knock credentials not found. Please set KNOCK_SECRET_KEY or KNOCK_API_KEY',
  );
  process.exit(1);
}

async function seedKnock() {
  try {
    console.log('🌱 Starting Knock user sync...\n');

    if (!knockClient) {
      console.error('❌ Knock client not initialized');
      process.exit(1);
    }

    // 1. Read users from database
    console.log('📖 Reading users from database...');
    const allUsers = await prisma.user.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    console.log(`  ✅ Found ${allUsers.length} users\n`);

    // 2. Identify users in Knock
    console.log('👥 Creating/updating users in Knock...');
    let knockUsersCreated = 0;
    let knockUsersFailed = 0;

    for (const user of allUsers) {
      try {
        await retryWithBackoff(async () => {
          if (!knockClient) throw new Error('Knock client not initialized');

          await knockClient.users.update(user.id, {
            email: user.email,
            name: user.username,
            avatar: user.avatarUrl || undefined,
          });
        });

        knockUsersCreated++;

        if (knockUsersCreated % 10 === 0) {
          console.log(`  ✅ Created ${knockUsersCreated}/${allUsers.length} users...`);
        }

        // Add delay to avoid rate limits
        await delay(250);
      } catch (error) {
        knockUsersFailed++;
        console.log(
          `  ⚠️  Warning: Could not create user ${user.id} (${user.email}) in Knock`,
        );
        console.log(
          `     Error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    console.log(
      `  ✅ Created ${knockUsersCreated}/${allUsers.length} users in Knock\n`,
    );

    // 3. Subscribe users to notification channels
    console.log('🔔 Subscribing users to notification channels...');
    let subscriptionsCreated = 0;
    let subscriptionsFailed = 0;

    const knockPushChannelId = process.env.KNOCK_PUSH_CHANNEL_ID;
    const knockInAppChannelId = process.env.KNOCK_IN_APP_CHANNEL_ID;

    if (knockPushChannelId || knockInAppChannelId) {
      for (const user of allUsers) {
        try {
          // Subscribe to in-app notifications
          if (knockInAppChannelId) {
            await retryWithBackoff(async () => {
              if (!knockClient)
                throw new Error('Knock client not initialized');

              await knockClient.users.setChannelData(
                user.id,
                knockInAppChannelId,
                {
                  tokens: [],
                },
              );
            });
          }

          // Subscribe to push notifications (without token for now)
          if (knockPushChannelId) {
            await retryWithBackoff(async () => {
              if (!knockClient)
                throw new Error('Knock client not initialized');

              await knockClient.users.setChannelData(
                user.id,
                knockPushChannelId,
                {
                  tokens: [],
                },
              );
            });
          }

          subscriptionsCreated++;

          if (subscriptionsCreated % 10 === 0) {
            console.log(
              `  ✅ Subscribed ${subscriptionsCreated}/${allUsers.length} users...`,
            );
          }

          // Add delay to avoid rate limits
          await delay(250);
        } catch (error) {
          subscriptionsFailed++;
          console.log(
            `  ⚠️  Warning: Could not subscribe user ${user.id} to channels`,
          );
          console.log(
            `     Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      console.log(
        `  ✅ Subscribed ${subscriptionsCreated}/${allUsers.length} users to channels\n`,
      );
    } else {
      console.log('  ℹ️  Skipping channel subscriptions - no channel IDs configured\n');
    }

    // 4. Set user preferences (optional - can be customized)
    console.log('⚙️  Setting user preferences...');
    let preferencesSet = 0;

    for (const user of allUsers) {
      try {
        await retryWithBackoff(async () => {
          if (!knockClient) throw new Error('Knock client not initialized');

          // Set default preferences - all notifications enabled
          await knockClient.users.setPreferences(user.id, {
            channel_types: {
              email: true,
              push: true,
              in_app_feed: true,
            },
          });
        });

        preferencesSet++;

        if (preferencesSet % 10 === 0) {
          console.log(
            `  ✅ Set preferences for ${preferencesSet}/${allUsers.length} users...`,
          );
        }

        // Add delay to avoid rate limits
        await delay(250);
      } catch (error) {
        // Non-critical, just log
        console.log(
          `  ⚠️  Warning: Could not set preferences for user ${user.id}`,
        );
      }
    }

    console.log(
      `  ✅ Set preferences for ${preferencesSet}/${allUsers.length} users\n`,
    );

    // Print Summary
    console.log('\n📊 Knock Sync Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`👤 Users synced: ${knockUsersCreated}/${allUsers.length}`);
    console.log(`   - Failed: ${knockUsersFailed}`);
    console.log(
      `🔔 Channel subscriptions: ${subscriptionsCreated}/${allUsers.length}`,
    );
    console.log(`   - Failed: ${subscriptionsFailed}`);
    console.log(`⚙️  Preferences set: ${preferencesSet}/${allUsers.length}`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ Knock sync completed successfully!\n');
  } catch (error) {
    console.error('❌ Error syncing Knock:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedKnock()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
