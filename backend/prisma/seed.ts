import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin
  const adminPassword = await bcrypt.hash('Admin@2024!', 10);
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@honeygroup.co.za' },
    update: {},
    create: {
      email:            'admin@honeygroup.co.za',
      password:         adminPassword,
      fullName:         'Administrator',
      role:             'ADMIN',
      status:           'approved',
      onboardingStatus: 'complete',
      phone:            '+27 11 000 0001',
      city:             'Johannesburg',
      province:         'Gauteng',
    },
  });
  console.log('Admin created:', admin.email);

  // Test Promoter
  const promoterPassword = await bcrypt.hash('Promoter@2024!', 10);
  const promoter = await prisma.user.upsert({
    where:  { email: 'promoter@honeygroup.co.za' },
    update: {},
    create: {
      email:            'promoter@honeygroup.co.za',
      password:         promoterPassword,
      fullName:         'Test Promoter',
      role:             'PROMOTER',
      status:           'approved',
      onboardingStatus: 'complete',
      phone:            '+27 72 000 0002',
      city:             'Johannesburg',
      province:         'Gauteng',
      gender:           'Female',
      height:           168,
    },
  });
  console.log('Promoter created:', promoter.email);

  // Test Business
  const businessPassword = await bcrypt.hash('Business@2024!', 10);
  const business = await prisma.user.upsert({
    where:  { email: 'business@honeygroup.co.za' },
    update: {},
    create: {
      email:            'business@honeygroup.co.za',
      password:         businessPassword,
      fullName:         'Test Business',
      role:             'BUSINESS',
      status:           'approved',
      onboardingStatus: 'complete',
      phone:            '+27 11 000 0003',
      city:             'Johannesburg',
      province:         'Gauteng',
      industry:         'FMCG / Beverages',
      website:          'testbusiness.co.za',
      contactName:      'Jane Smith',
    },
  });
  console.log('Business created:', business.email);

  console.log('');
  console.log('Seeding complete!');
  console.log('Admin:    admin@honeygroup.co.za    / Admin@2024!');
  console.log('Promoter: promoter@honeygroup.co.za / Promoter@2024!');
  console.log('Business: business@honeygroup.co.za / Business@2024!');
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });