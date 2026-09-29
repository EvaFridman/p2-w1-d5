import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from './favorites.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('FavoritesService', () => {
  let service: FavoritesService;

  const mockPrismaService = {
    favorites: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
