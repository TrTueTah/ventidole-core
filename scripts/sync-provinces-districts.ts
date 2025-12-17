import axios from 'axios';
import 'dotenv/config';
import { PrismaClient } from '../src/db/prisma/client';

const prisma = new PrismaClient();

interface Province {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts: any[];
}

interface District {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
  wards: any[];
}

async function syncProvinces() {
  try {
    console.log('Fetching provinces from API...');
    const response = await axios.get<Province[]>(
      'https://provinces.open-api.vn/api/v1/p/',
    );
    const provinces = response.data;

    console.log(`Found ${provinces.length} provinces. Syncing to database...`);

    for (const province of provinces) {
      await prisma.province.upsert({
        where: { code: province.code },
        update: {
          name: province.name,
          divisionType: province.division_type,
          phoneCode: province.phone_code,
          codename: province.codename,
        },
        create: {
          code: province.code,
          name: province.name,
          divisionType: province.division_type,
          phoneCode: province.phone_code,
          codename: province.codename,
        },
      });
    }

    console.log('✓ Provinces synced successfully');
    return provinces.length;
  } catch (error) {
    console.error('Error syncing provinces:', error);
    throw error;
  }
}

async function syncDistricts() {
  try {
    console.log('Fetching districts from API...');
    const response = await axios.get<District[]>(
      'https://provinces.open-api.vn/api/v1/d/',
    );
    const districts = response.data;

    console.log(`Found ${districts.length} districts. Syncing to database...`);

    for (const district of districts) {
      await prisma.district.upsert({
        where: { code: district.code },
        update: {
          name: district.name,
          divisionType: district.division_type,
          codename: district.codename,
          provinceCode: district.province_code,
        },
        create: {
          code: district.code,
          name: district.name,
          divisionType: district.division_type,
          codename: district.codename,
          provinceCode: district.province_code,
        },
      });
    }

    console.log('✓ Districts synced successfully');
    return districts.length;
  } catch (error) {
    console.error('Error syncing districts:', error);
    throw error;
  }
}

async function main() {
  console.log('Starting province and district sync...\n');

  try {
    const provinceCount = await syncProvinces();
    console.log(`\n✓ Synced ${provinceCount} provinces`);

    const districtCount = await syncDistricts();
    console.log(`✓ Synced ${districtCount} districts`);

    console.log('\n✅ Sync completed successfully!');
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
