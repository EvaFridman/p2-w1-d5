import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { pino } from 'pino';
import {
  DealType,
  ListingStatus,
  PrismaClient,
  PropertyType,
  UserRole,
} from './generated/prisma/index.js';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

const CITY = 'Москва';
const CITY_CENTER = { lat: 55.751244, lng: 37.618423 };

const DISTRICTS = [
  { title: 'Центральный', slug: 'centralnyj' },
  { title: 'Северный', slug: 'severnyj' },
  { title: 'Южный', slug: 'yuzhnyj' },
  { title: 'Западный', slug: 'zapadnyj' },
  { title: 'Восточный', slug: 'vostochnyj' },
  { title: 'Северо-Западный', slug: 'severo-zapadnyj' },
];

const USERS = [
  {
    name: 'Модератор',
    email: 'moderator@realty.local',
    phone: '+79000000001',
    role: UserRole.moderator,
  },
  {
    name: 'Анна Агентова',
    email: 'agent1@realty.local',
    phone: '+79000000002',
    role: UserRole.agent,
  },
  {
    name: 'Иван Агентов',
    email: 'agent2@realty.local',
    phone: '+79000000003',
    role: UserRole.agent,
  },
  {
    name: 'Клиент',
    email: 'client@realty.local',
    phone: '+79000000004',
    role: UserRole.client,
  },
];

const STREETS = [
  'ул. Тверская',
  'ул. Арбат',
  'пр. Мира',
  'Ленинский пр.',
  'ул. Покровка',
  'Кутузовский пр.',
];
const PROPERTY_TYPES = [
  PropertyType.flat,
  PropertyType.house,
  PropertyType.room,
  PropertyType.commercial,
];
const LISTINGS_COUNT = 36;
const PHOTOS_PER_LISTING = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

function listingStatus(index: number): ListingStatus {
  if (index % 12 === 10) return ListingStatus.MODERATION;
  if (index % 12 === 11) return ListingStatus.DRAFT;
  return ListingStatus.PUBLISHED;
}

async function seed(prisma: PrismaClient, password: string) {
  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 10);

  const districts = await Promise.all(
    DISTRICTS.map((district) =>
      prisma.districts.create({
        data: { ...district, city: CITY, createdAt: now, updatedAt: now },
      }),
    ),
  );

  const users = await Promise.all(
    USERS.map((user) =>
      prisma.users.create({
        data: { ...user, passwordHash, createdAt: now, updatedAt: now },
      }),
    ),
  );
  const agents = users.filter((user) => user.role === UserRole.agent);

  for (let index = 0; index < LISTINGS_COUNT; index++) {
    const dealType = index % 2 === 0 ? DealType.sale : DealType.rent;
    const area = 30 + ((index * 7) % 120);
    const status = listingStatus(index);
    const createdAt = new Date(now.getTime() - (index + 1) * DAY_MS);
    const totalFloors = 5 + (index % 20);

    const listing = await prisma.listings.create({
      data: {
        agentId: agents[index % agents.length].id,
        districtId: districts[index % districts.length].id,
        title: `${dealType === DealType.sale ? 'Продажа' : 'Аренда'} ${area}м²`,
        description: `Объявление из тестовых данных №${index + 1}.`,
        dealType,
        propertyType: PROPERTY_TYPES[index % PROPERTY_TYPES.length],
        price:
          dealType === DealType.sale
            ? 4_000_000 + index * 250_000
            : 30_000 + index * 2_500,
        area,
        rooms: 1 + (index % 4),
        floor: 1 + (index % totalFloors),
        totalFloors,
        address: `${STREETS[index % STREETS.length]}, ${index + 1}`,
        lat: CITY_CENTER.lat + ((index % 9) - 4) * 0.01,
        lng: CITY_CENTER.lng + ((index % 7) - 3) * 0.015,
        status,
        publishedAt: status === ListingStatus.PUBLISHED ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
      },
    });

    await prisma.listingPhotos.createMany({
      data: Array.from({ length: PHOTOS_PER_LISTING }, (_, position) => ({
        listingId: listing.id,
        externalUrl: `https://picsum.photos/seed/realty-${listing.id}-${position}/800/600`,
        position,
        isCover: position === 0,
        createdAt,
        updatedAt: createdAt,
      })),
    });
  }

  return {
    districts: districts.length,
    users: users.length,
    listings: LISTINGS_COUNT,
  };
}

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) {
    logger.error('SEED_PASSWORD must be set (at least 8 characters)');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      new Pool({ connectionString: process.env.DATABASE_URL }),
    ),
  });

  try {
    if ((await prisma.users.count()) > 0) {
      logger.info('Seed skipped: the database already has users');
      return;
    }
    const created = await seed(prisma, password);
    logger.info(created, 'Seed completed');
  } finally {
    await prisma.$disconnect();
  }
}

await main();
