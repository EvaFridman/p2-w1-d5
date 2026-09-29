import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { ListingsService } from './listings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PdfService } from '../pdf/pdf.service.js';
import { PublisherService } from '../queue/publisher.service.js';
import { ListingStatus } from '../generated/prisma/index.js';

type FindManyArgs = {
  where: {
    status: ListingStatus;
    publishedAt: { lte: Date };
  };
  select: { id: boolean };
};

describe('ListingsService', () => {
  let service: ListingsService;
  const findMany = jest.fn<(args: FindManyArgs) => Promise<{ id: number }[]>>();
  const prisma = { listings: { findMany } };

  beforeEach(async () => {
    findMany.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: EventEmitter2,
          useValue: {},
        },
        {
          provide: PdfService,
          useValue: {},
        },
        {
          provide: PublisherService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('repeated call does not process already expired listings again', async () => {
    findMany
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([]);
    const updateStatus = jest
      .spyOn(service, 'updateStatus')
      .mockResolvedValue({});
    const firstResult = await service.expireOldListings();
    const secondResult = await service.expireOldListings();

    expect(firstResult).toBe(2);
    expect(secondResult).toBe(0);
    expect(updateStatus).toHaveBeenCalledTimes(2);
  });

  it('processes an old listing when the task catches up after a missed run', async () => {
    findMany.mockResolvedValue([{ id: 10 }]);
    const updateStatus = jest
      .spyOn(service, 'updateStatus')
      .mockResolvedValue({});
    const result = await service.expireOldListings();

    expect(result).toBe(1);
    expect(updateStatus).toHaveBeenCalledWith(
      10,
      { status: ListingStatus.UNPUBLISHED },
      { expired: true },
    );
  });

  it('includes a listing exactly on the 60-day deadline but excludes a newer listing', async () => {
    const now = new Date('2026-09-25T12:00:00.000Z').getTime();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    findMany.mockResolvedValue([]);
    await service.expireOldListings();
    const call = findMany.mock.calls[0];

    expect(call).toBeDefined();

    const cutoff = call[0].where.publishedAt.lte;
    const exactDeadline = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const oneDayNewer = new Date(now - 59 * 24 * 60 * 60 * 1000);

    expect(exactDeadline.getTime()).toBe(cutoff.getTime());
    expect(oneDayNewer.getTime()).toBeGreaterThan(cutoff.getTime());
    expect(call[0].where.status).toBe(ListingStatus.PUBLISHED);

    jest.restoreAllMocks();
  });
});
