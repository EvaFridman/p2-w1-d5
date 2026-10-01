import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
  ValidationError,
} from '../errors/app.exception.js';
import {
  SavedSearchesService,
  nextDefaultName,
} from './saved-searches.service.js';

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

const DEFAULT_SORT = 'sortBy=publishedAt&sortOrder=desc';

describe('SavedSearchesService', () => {
  let service: SavedSearchesService;

  const savedSearches = {
    findMany: jest.fn() as AsyncMock,
    create: jest.fn() as AsyncMock,
    deleteMany: jest.fn() as AsyncMock,
    findUnique: jest.fn() as AsyncMock,
  };

  const existing = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      nameKey: `поиск ${i + 1}`,
      query: `dealType=sale&districtId=${i + 1}&${DEFAULT_SORT}`,
    }));

  beforeEach(async () => {
    jest.clearAllMocks();
    savedSearches.create.mockImplementation((args) =>
      Promise.resolve({
        id: 1,
        createdAt: new Date('2026-10-01'),
        ...(args as { data: object }).data,
      }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedSearchesService,
        { provide: PrismaService, useValue: { savedSearches } },
        { provide: PinoLogger, useValue: { info: jest.fn() } },
      ],
    }).compile();

    service = module.get(SavedSearchesService);
  });

  describe('create', () => {
    it('saves the normalized query under the given name', async () => {
      savedSearches.findMany.mockResolvedValue([]);

      const result = await service.create(7, {
        query: 'rooms=2&dealType=rent&rooms=1&page=4',
        name: '  Двушки у метро ',
      });

      const { data } = savedSearches.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(data).toMatchObject({
        userId: 7,
        name: 'Двушки у метро',
        nameKey: 'двушки у метро',
        query: `dealType=rent&rooms=1&rooms=2&${DEFAULT_SORT}`,
      });
      expect(data.token).toMatch(/^[0-9a-f]{32}$/);
      expect(result).toMatchObject({
        name: 'Двушки у метро',
        isOutdated: false,
      });
    });

    it('gives a default name with the smallest free number', async () => {
      savedSearches.findMany.mockResolvedValue([
        { nameKey: 'поиск 1', query: 'a' },
        { nameKey: 'поиск 3', query: 'b' },
      ]);

      const result = await service.create(7, { query: 'dealType=sale' });

      expect(result.name).toBe('Поиск 2');
    });

    it('rejects a query the catalog does not accept', async () => {
      await expect(
        service.create(7, { query: 'propertyType=castle' }),
      ).rejects.toThrow(ValidationError);
      expect(savedSearches.findMany).not.toHaveBeenCalled();
    });

    it('rejects the same parameters in a different order', async () => {
      savedSearches.findMany.mockResolvedValue([
        {
          nameKey: 'мой',
          query: `dealType=sale&rooms=1&rooms=2&${DEFAULT_SORT}`,
        },
      ]);

      await expect(
        service.create(7, { query: 'rooms=2&rooms=1&dealType=sale' }),
      ).rejects.toMatchObject({
        constructor: ConflictError,
        response: { code: 'SAVED_SEARCH_DUPLICATE_QUERY' },
      });
      expect(savedSearches.create).not.toHaveBeenCalled();
    });

    it('rejects a name that differs only in case and spaces', async () => {
      savedSearches.findMany.mockResolvedValue([
        { nameKey: 'двушки', query: `dealType=rent&${DEFAULT_SORT}` },
      ]);

      await expect(
        service.create(7, { query: 'dealType=sale', name: ' ДВУШКИ ' }),
      ).rejects.toMatchObject({
        constructor: ConflictError,
        response: { code: 'SAVED_SEARCH_DUPLICATE_NAME' },
      });
    });

    it('allows the 10th search and rejects the 11th', async () => {
      savedSearches.findMany.mockResolvedValue(existing(9));
      await expect(
        service.create(7, { query: 'dealType=rent' }),
      ).resolves.toBeDefined();

      savedSearches.findMany.mockResolvedValue(existing(10));
      await expect(
        service.create(7, { query: 'dealType=rent' }),
      ).rejects.toMatchObject({
        constructor: UnprocessableEntityError,
        response: { code: 'SAVED_SEARCH_LIMIT' },
      });
    });
  });

  describe('findAll', () => {
    it('marks searches the catalog no longer accepts as outdated', async () => {
      savedSearches.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'ok',
          token: 't1',
          query: `dealType=sale&${DEFAULT_SORT}`,
        },
        { id: 2, name: 'old', token: 't2', query: 'hasBalcony=true' },
      ]);

      const result = await service.findAll(7);

      expect(result.map((search) => search.isOutdated)).toEqual([false, true]);
      expect(savedSearches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 7 } }),
      );
    });
  });

  describe('remove', () => {
    it('deletes an own search', async () => {
      savedSearches.deleteMany.mockResolvedValue({ count: 1 });

      await expect(service.remove(7, 3)).resolves.toEqual({ id: 3 });
      expect(savedSearches.deleteMany).toHaveBeenCalledWith({
        where: { id: 3, userId: 7 },
      });
    });

    it('throws NotFoundError for a missing or foreign search', async () => {
      savedSearches.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove(8, 3)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByToken', () => {
    it('returns only the query and whether it is outdated', async () => {
      savedSearches.findUnique.mockResolvedValue({
        query: `dealType=sale&${DEFAULT_SORT}`,
      });

      await expect(service.findByToken('abc')).resolves.toEqual({
        query: `dealType=sale&${DEFAULT_SORT}`,
        isOutdated: false,
      });
    });

    it('throws NotFoundError for an unknown token', async () => {
      savedSearches.findUnique.mockResolvedValue(null);

      await expect(service.findByToken('nope')).rejects.toThrow(NotFoundError);
    });
  });
});

describe('nextDefaultName', () => {
  it('starts at 1 and fills gaps', () => {
    expect(nextDefaultName([])).toBe('Поиск 1');
    expect(nextDefaultName(['поиск 1', 'поиск 2', 'поиск 4'])).toBe('Поиск 3');
  });
});
