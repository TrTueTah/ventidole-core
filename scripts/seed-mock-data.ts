import 'dotenv/config';
import { PrismaClient } from '../src/db/prisma/client';
import * as bcrypt from 'bcryptjs';

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
      { email: 'jennie@ventidole.com', username: 'Jennie', communityId: communities[0].id, bio: 'Main rapper of BLACKPINK' },
      { email: 'lisa@ventidole.com', username: 'Lisa', communityId: communities[0].id, bio: 'Main dancer of BLACKPINK' },
      { email: 'jisoo@ventidole.com', username: 'Jisoo', communityId: communities[0].id, bio: 'Lead vocalist of BLACKPINK' },
      { email: 'rose@ventidole.com', username: 'Rosé', communityId: communities[0].id, bio: 'Main vocalist of BLACKPINK' },
      { email: 'rm@ventidole.com', username: 'RM', communityId: communities[1].id, bio: 'Leader and rapper of BTS' },
      { email: 'jungkook@ventidole.com', username: 'Jungkook', communityId: communities[1].id, bio: 'Main vocalist of BTS' },
      { email: 'nayeon@ventidole.com', username: 'Nayeon', communityId: communities[2].id, bio: 'Lead vocalist of TWICE' },
      { email: 'sana@ventidole.com', username: 'Sana', communityId: communities[2].id, bio: 'Vocalist of TWICE' },
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
      const shuffledCommunities = [...communities].sort(() => Math.random() - 0.5);

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
        ch => ch.type === 'GROUP' && ch.communityId === follower.communityId
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
        ch => ch.communityId === idol.communityId
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

    // 8. Create Social Accounts (some users have Google/Facebook login)
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
    console.log(`   - ${chatChannels.filter(c => c.type === 'ANNOUNCEMENT').length} Announcement channels`);
    console.log(`   - ${chatChannels.filter(c => c.type === 'GROUP').length} Group channels`);
    console.log(`   - ${chatChannels.filter(c => c.type === 'DIRECT').length} Direct message channels`);
    console.log(`👥 Chat Participants: ${participants.length}`);
    console.log(`🔗 Social Accounts: ${socialAccounts.length}`);
    console.log('═══════════════════════════════════════\n');

    console.log('📋 Test Credentials:');
    console.log('═══════════════════════════════════════');
    console.log('Admin Account:');
    console.log('  Email: admin@ventidole.com');
    console.log('  Password: admin123\n');
    console.log('Idol Accounts (password: admin123):');
    idolData.forEach(idol => {
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
