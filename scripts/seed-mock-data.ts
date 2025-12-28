import 'dotenv/config';
import { StreamChat } from 'stream-chat';
import { PrismaClient } from '../src/db/prisma/client';

const prisma = new PrismaClient();

// Helper function to add delay between API calls to avoid rate limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Initialize Stream Chat client only if env vars are present
let streamChatClient: StreamChat | null = null;
if (process.env.STREAM_CHAT_API_KEY && process.env.STREAM_CHAT_SECRET) {
  streamChatClient = StreamChat.getInstance(
    process.env.STREAM_CHAT_API_KEY,
    process.env.STREAM_CHAT_SECRET,
  );
  console.log('✅ Stream Chat client initialized');
} else {
  console.log(
    '⚠️  Stream Chat not configured - will skip Stream Chat operations',
  );
}

async function seedMockData() {
  try {
    console.log('🌱 Starting to seed mock data...\n');

    // 0. Clear existing data (only tables not managed by seed_all.py)
    console.log('🗑️  Clearing existing data...');
    await prisma.paymentTransaction.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.productType.deleteMany();
    await prisma.shop.deleteMany();
    await prisma.socialAccount.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.chatParticipant.deleteMany();
    await prisma.chatChannel.deleteMany();
    console.log('  ✅ Cleared existing data\n');

    // 1. Read existing data from database (created by seed_all.py)
    console.log('📖 Reading existing data from database...');

    const communities = await prisma.community.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Found ${communities.length} communities`);

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

    // 2. Create users in Stream Chat (if configured)
    if (streamChatClient) {
      console.log('👥 Creating users in Stream Chat...');
      const allUsers = [...(adminUser ? [adminUser] : []), ...idols, ...fans];
      let streamUsersCreated = 0;

      for (const user of allUsers) {
        try {
          await streamChatClient.upsertUser({
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
        `  ✅ Created ${streamUsersCreated}/${allUsers.length} users in Stream Chat\n`,
      );
    }

    // 3. Read Community Followers from database
    console.log('💙 Reading community followers...');
    const followers = await prisma.communityFollower.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Found ${followers.length} community follows\n`);

    // 4. Create Chat Channels (one channel per community)
    console.log('💬 Creating chat channels...');
    const chatChannelsData = communities.map((community) => ({
      type: 'messaging',
      name: `${community.name} Community`,
      description: `Official community channel for ${community.name}`,
      communityId: community.id,
      isCommunityChannel: true,
      memberCount: 0,
    }));

    await prisma.chatChannel.createMany({
      data: chatChannelsData,
    });
    const chatChannels = await prisma.chatChannel.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(
      `  ✅ Created ${chatChannels.length} chat channels in database`,
    );

    // Create channels in GetStream (if configured)
    let streamChannelsCreated = 0;
    if (streamChatClient) {
      console.log('  🔄 Creating channels in GetStream...');

      for (const channel of chatChannels) {
        try {
          // For community channels, find the first idol in that community
          const communityIdol = idols.find(
            (i) => i.communityId === channel.communityId,
          );
          const creatorId = communityIdol
            ? communityIdol.id
            : adminUser?.id || idols[0]?.id;

          const streamChannel = streamChatClient.channel(
            channel.type,
            channel.id,
            {
              created_by_id: creatorId,
            },
          );
          await streamChannel.create();
          streamChannelsCreated++;
          // Add delay to avoid rate limits
          await delay(250);
        } catch (error) {
          console.log(
            `    ⚠️  Warning: Could not create channel ${channel.id} in GetStream (saved in DB)`,
          );
          console.log(
            `       Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      console.log(
        `  ✅ Created ${streamChannelsCreated}/${chatChannels.length} channels in GetStream\n`,
      );
    } else {
      console.log(
        '  ⚠️  GetStream not configured - skipping channel creation in GetStream\n',
      );
    }

    // 5. Create Chat Participants
    console.log('👤 Adding chat participants...');
    const participantsData: Array<{
      channelId: string;
      userId: string;
      role: string;
      canSendMessage: boolean;
    }> = [];

    // Helper: map each community to its channel
    const communityChannelMap = new Map<string, string>(); // communityId -> channelId

    for (const community of communities) {
      const communityChannel = chatChannels.find(
        (ch) => ch.communityId === community.id,
      );
      if (communityChannel) {
        communityChannelMap.set(community.id, communityChannel.id);
      }
    }

    // Add all idols to their community channel as owners
    for (const idol of idols) {
      const channelId = communityChannelMap.get(idol.communityId!);
      if (channelId) {
        participantsData.push({
          channelId,
          userId: idol.id,
          role: 'owner',
          canSendMessage: true,
        });
      }
    }

    // Add all followers to their community channel as members
    for (const follower of followers) {
      const channelId = communityChannelMap.get(follower.communityId);
      if (channelId) {
        participantsData.push({
          channelId,
          userId: follower.userId,
          role: 'member',
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
    console.log(
      `  ✅ Created ${participants.length} chat participants in database`,
    );

    // Add participants to GetStream channels (if configured)
    let streamMembersAdded = 0;
    const channelMemberMap = new Map<string, string[]>();

    // Group participants by channel
    for (const participant of participants) {
      if (!channelMemberMap.has(participant.channelId)) {
        channelMemberMap.set(participant.channelId, []);
      }
      channelMemberMap.get(participant.channelId)!.push(participant.userId);
    }

    if (streamChatClient) {
      // Add members to each channel in GetStream
      console.log('  🔄 Adding participants to GetStream channels...');
      for (const [channelId, memberIds] of Array.from(
        channelMemberMap.entries(),
      )) {
        try {
          const channel = chatChannels.find((ch) => ch.id === channelId);
          if (channel) {
            const streamChannel = streamChatClient.channel(
              channel.type,
              channelId,
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
          }
        } catch (error) {
          console.log(
            `    ⚠️  Warning: Could not add members to channel ${channelId} in GetStream`,
          );
          console.log(
            `       Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      console.log(
        `  ✅ Added ${streamMembersAdded}/${participants.length} members to GetStream channels\n`,
      );
    } else {
      console.log(
        '  ⚠️  GetStream not configured - skipping participant sync to GetStream\n',
      );
    }

    // Update channel member counts
    console.log('  🔄 Updating channel member counts...');
    for (const [channelId, memberIds] of Array.from(
      channelMemberMap.entries(),
    )) {
      await prisma.chatChannel.update({
        where: { id: channelId },
        data: { memberCount: memberIds.length },
      });
    }
    console.log('  ✅ Updated channel member counts\n');

    // 6. Create Chat Messages
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
    console.log(`  ✅ Created ${messages.length} chat messages in database`);

    // Send messages to GetStream (if configured)
    let streamMessagesSent = 0;
    if (streamChatClient) {
      console.log('  🔄 Sending messages to GetStream...');

      for (const message of messages) {
        try {
          const channel = chatChannels.find(
            (ch) => ch.id === message.channelId,
          );
          if (channel) {
            const streamChannel = streamChatClient.channel(
              channel.type,
              message.channelId,
            );
            await streamChannel.sendMessage({
              id: message.id,
              text: message.content,
              user_id: message.userId,
            } as Record<string, unknown>);
            streamMessagesSent++;
            // Add delay to avoid rate limits
            await delay(250);
          }
        } catch (error) {
          console.log(
            `    ⚠️  Warning: Could not send message ${message.id} to GetStream`,
          );
          console.log(
            `       Error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      console.log(
        `  ✅ Sent ${streamMessagesSent}/${messages.length} messages to GetStream\n`,
      );
    } else {
      console.log(
        '  ⚠️  GetStream not configured - skipping message sync to GetStream\n',
      );
    }

    // 7. Read Posts from database
    console.log('📝 Reading posts...');
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  ✅ Found ${posts.length} posts\n`);

    // Media URLs to be used in products
    const availableMediaUrls = [
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1762054385/kt1-6905e9f7e7ad5_z2wfqq.jpg',
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1758008644/iK-Cji6J73Q-HD_nmbkfm.jpg',
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1762853124/273532258_1528902877562442_6813889931345818717_n_bqaajl.webp',
    ];

    // 8. Create Social Accounts (some users have Google/Facebook login)
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

    // 9. Create Product Types
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

    // 10. Create Shops for Communities
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

    // 11. Create Products
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

    // 12. Create Product Variants
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

    // 13. Create Carts for Fans
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

    // 14. Create Cart Items (some fans have items in cart)
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

    // 15. Create Orders - SKIPPED
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
    // Comments, likes, and views are managed by seed_all.py
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
    if (adminUser) {
      console.log('Admin Account:');
      console.log(`  Email: ${adminUser.email}`);
      console.log('  Password: (from seed_all.py)\n');
    }
    console.log('Idol Accounts:');
    idols.slice(0, 5).forEach((idol) => {
      console.log(`  - ${idol.email} (${idol.username})`);
    });
    if (idols.length > 5) {
      console.log(`  ... and ${idols.length - 5} more`);
    }
    console.log('\nFan Accounts:');
    console.log(`  - ${fans.length} fan accounts (from seed_all.py)`);
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
