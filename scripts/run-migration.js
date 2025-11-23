const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Starting migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      '..',
      'prisma',
      'migrations',
      '20251123150000_complete_schema_refactor',
      'migration.sql'
    );

    console.log(`📖 Reading migration file: ${migrationPath}\n`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration SQL...\n');

    // Execute the entire SQL as one transaction
    await prisma.$executeRawUnsafe(migrationSQL);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verifying database schema...\n');

    // Verify the migration
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log('Current database tables:');
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });

    console.log('\n✅ Verifying key tables exist:');
    const requiredTables = ['user', 'community', 'community_follower', 'idol', 'chat_channel', 'chat_participant'];
    const tableNames = tables.map(t => t.tablename);

    requiredTables.forEach(tableName => {
      if (tableNames.includes(tableName)) {
        console.log(`  ✅ ${tableName} - exists`);
      } else {
        console.log(`  ❌ ${tableName} - MISSING`);
      }
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error');
    process.exit(1);
  });
