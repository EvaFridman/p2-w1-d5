import { Test, TestingModule } from '@nestjs/testing';
import { ViewingsService } from './viewings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { PublisherService } from '../queue/publisher.service.js';
import { PinoLogger } from 'nestjs-pino';
import { jest } from '@jest/globals';
import { ViewingStatus } from '../generated/prisma/index.js';
import { NotFoundError } from '../errors/app.exception.js';
import { getAllowedTransitions } from '../common/viewingStatusTransitions.service.js';

describe('ViewingsService', () => {
  let service: ViewingsService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    },
    listings: {
      findUnique: jest.fn(),
    },
    viewings: {
      create: jest.fn(),
      findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPublisherService = {
    publish: jest.fn(),
  };

  const mockPinoLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViewingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PublisherService, useValue: mockPublisherService },
        { provide: PinoLogger, useValue: mockPinoLogger },
      ],
    }).compile();

    service = module.get<ViewingsService>(ViewingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findRecentByAgent', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns the latest viewings of the agent listings with transitions', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ role: 'agent' });
      mockPrismaService.viewings.findMany.mockResolvedValue([
        { id: 2, status: ViewingStatus.CREATED, listing: { agentId: 7 } },
      ]);

      const result = await service.findRecentByAgent(7, { limit: 3 });

      expect(mockPrismaService.viewings.findMany).toHaveBeenCalledWith({
        where: { listing: { agentId: 7 } },
        take: 3,
        include: { listing: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([
        {
          id: 2,
          status: ViewingStatus.CREATED,
          listing: { agentId: 7 },
          allowedTransitions: getAllowedTransitions(ViewingStatus.CREATED),
        },
      ]);
    });

    it('uses a limit of 5 when none is given', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ role: 'agent' });
      mockPrismaService.viewings.findMany.mockResolvedValue([]);

      await service.findRecentByAgent(7, {});

      expect(mockPrismaService.viewings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('throws NotFoundError when the user does not exist', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.findRecentByAgent(99, {})).rejects.toThrow(
        NotFoundError,
      );
      expect(mockPrismaService.viewings.findMany).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when the user is not an agent', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ role: 'client' });

      await expect(service.findRecentByAgent(3, {})).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
