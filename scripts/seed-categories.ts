import { config } from 'dotenv';
import { PrismaClient } from '../src/db/prisma/client';

// Load environment variables
config();

const prisma = new PrismaClient();

async function seedProductCategories() {
  try {
    // Create some sample product categories
    const categories = [
      { name: 'Merchandise' },
      { name: 'Albums' },
      { name: 'Concert Tickets' },
      { name: 'Light Sticks' },
      { name: 'Clothing' },
      { name: 'Accessories' },
      { name: 'Collectibles' },
      { name: 'Digital Content' },
    ];

    console.log('🌱 Seeding product categories...');

    for (const category of categories) {
      const existingCategory = await prisma.productCategory.findFirst({
        where: { name: category.name }
      });

      if (!existingCategory) {
        const created = await prisma.productCategory.create({
          data: category
        });
        console.log(`✅ Created category: ${created.name} (ID: ${created.id})`);
      } else {
        console.log(`⏭️  Category already exists: ${category.name}`);
      }
    }

    console.log('🎉 Product categories seeded successfully!');

    // Display all categories for reference
    const allCategories = await prisma.productCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    console.log('\n📋 Available Product Categories:');
    allCategories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    });

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProductCategories();