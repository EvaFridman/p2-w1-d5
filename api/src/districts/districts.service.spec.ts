import { Test, TestingModule } from '@nestjs/testing';
import { DistrictsService } from './districts.service.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundError } from '../errors/app.exception.js';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

describe('DistrictsService', () => {
  let service: DistrictsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistrictsService,
        {
          provide: PrismaService,
          useValue: {
            districts: {
              findUnique: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<DistrictsService>(DistrictsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return a district if found', async () => {
    const mockDistrict = {
      id: 1,
      title: 'Северный район 1',
      slug: 'severnyy-rayon-1',
      city: 'Казань',
    };

    const mockFindUnique = prisma.districts.findUnique as unknown as ReturnType<
      typeof jest.fn
    >;
    mockFindUnique.mockResolvedValue(mockDistrict);

    const result = await service.findOne(1);
    expect(result).toEqual(mockDistrict);
  });

  it('should throw NotFoundError if district not found', async () => {
    const mockFindUnique = prisma.districts.findUnique as unknown as ReturnType<
      typeof jest.fn
    >;
    mockFindUnique.mockResolvedValue(null);

    await expect(service.findOne(1)).rejects.toThrow(NotFoundError);
  });

  it('should return correct count of districts', async () => {
    const mockCount = prisma.districts.count as unknown as ReturnType<
      typeof jest.fn
    >;
    mockCount.mockResolvedValue(7);

    const result = await service.count();
    expect(result).toBe(7);
  });
});
