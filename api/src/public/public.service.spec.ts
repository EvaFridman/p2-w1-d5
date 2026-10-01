import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { PublicService } from './public.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CacheService } from '../redis/cache.service.js';
import { PublisherService } from '../queue/publisher.service.js';
import { ListingStatus } from '../generated/prisma/index.js';
import { NotFoundError } from '../errors/app.exception.js';

const listing = (id: number) => ({
  id,
  title: `Объявление ${id}`,
  price: '100000',
  photos: [],
});

describe('PublicService', () => {
  let service: PublicService;
  const prisma = {
    favorites: {
      findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    },
    listings: {
      findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: CacheService, useValue: {} },
        { provide: PublisherService, useValue: {} },
        { provide: PinoLogger, useValue: { info: jest.fn() } },
      ],
    }).compile();

    service = module.get<PublicService>(PublicService);
  });

  describe('findFavoriteListings', () => {
    it('returns published favorite listings of the user, newest first', async () => {
      prisma.favorites.findMany.mockResolvedValue([
        { listing: listing(7) },
        { listing: listing(3) },
      ]);

      const result = await service.findFavoriteListings({ id: 42 });

      expect(result).toEqual([listing(7), listing(3)]);
      expect(prisma.favorites.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 42,
            listing: { status: ListingStatus.PUBLISHED },
          },
          orderBy: { addedAt: 'desc' },
        }),
      );
    });

    it('returns an empty list when nothing is published', async () => {
      prisma.favorites.findMany.mockResolvedValue([]);

      await expect(service.findFavoriteListings({ id: 42 })).resolves.toEqual(
        [],
      );
    });
  });

  describe('findOneListing', () => {
    it('returns a published listing without its status', async () => {
      prisma.listings.findUnique.mockResolvedValue({
        ...listing(7),
        status: ListingStatus.PUBLISHED,
      });

      const result = await service.findOneListing(7);

      expect(result).toEqual(listing(7));
    });

    it('throws NotFoundError for a listing that is not published', async () => {
      prisma.listings.findUnique.mockResolvedValue({
        ...listing(4),
        status: ListingStatus.UNPUBLISHED,
      });

      await expect(service.findOneListing(4)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});
