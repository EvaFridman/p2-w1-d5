import { Test, TestingModule } from '@nestjs/testing';
import { ViewingsService } from './viewings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { PublisherService } from '../queue/publisher.service.js';
import { PinoLogger } from 'nestjs-pino';
import { jest } from '@jest/globals';

describe('ViewingsService', () => {
  let service: ViewingsService;

  const mockPrismaService = {
    listings: {
      findUnique: jest.fn(),
    },
    viewings: {
      create: jest.fn(),
      findMany: jest.fn(),
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
});
