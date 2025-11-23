import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comment-only lines
      if (statement.startsWith('--')) continue;

      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 100)}...`);

      try {
        await prisma.$executeRawUnsafe(statement + ';');
        console.log(`  ✅ Success\n`);
      } catch (error: any) {
        // Some errors are expected (like "table already exists" or "column already exists")
        if (
          error.message.includes('already exists') ||
          error.message.includes('does not exist') ||
          error.message.includes('IF EXISTS')
        ) {
          console.log(`  ⚠️  Skipped (already applied): ${error.message}\n`);
        } else {
          console.error(`  ❌ Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verifying database schema...\n');

    // Verify the migration
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log('Current database tables:');
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
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
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
