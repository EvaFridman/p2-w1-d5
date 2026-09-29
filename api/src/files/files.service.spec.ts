import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import fs from 'fs/promises';
import { Dirent, Stats } from 'fs';
import path from 'path';
import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from '@jest/globals';

describe('FilesService', () => {
  let service: FilesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: {
            listingPhotos: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete old orphaned files', async () => {
    const now = new Date('2026-09-23T12:00:00Z').getTime();
    const oldFileTime = now - 25 * 60 * 60 * 1000;

    jest.spyOn(Date, 'now').mockReturnValue(now);
    
    const mockFindMany = prisma.listingPhotos.findMany as unknown as ReturnType<typeof jest.fn>;
    mockFindMany.mockResolvedValue([]);

    jest.spyOn(fs, 'readdir');
    jest.mocked(fs.readdir).mockResolvedValue([
      { name: 'orphan.jpg', isFile: () => true } as Dirent,
    ]);

    jest.spyOn(fs, 'stat');
    jest.mocked(fs.stat).mockResolvedValue({ mtimeMs: oldFileTime } as Stats);

    jest.spyOn(fs, 'unlink');
    jest.mocked(fs.unlink).mockResolvedValue(undefined);

    const result = await service.removeOrphaned();

    expect(result).toBe(1);
    expect(fs.unlink).toHaveBeenCalledWith(
      path.resolve('./uploads/photos/orphan.jpg'),
    );
  });

  it('should not delete files attached to a listing', async () => {
    const now = new Date('2026-09-23T12:00:00Z').getTime();
    const oldFileTime = now - 25 * 60 * 60 * 1000;

    jest.spyOn(Date, 'now').mockReturnValue(now);

    const mockFindMany = prisma.listingPhotos.findMany as unknown as ReturnType<typeof jest.fn>;
    mockFindMany.mockResolvedValue([
      { fileName: 'attached.jpg' },
    ]);

    jest.spyOn(fs, 'readdir');
    jest.mocked(fs.readdir).mockResolvedValue([
      { name: 'attached.jpg', isFile: () => true } as Dirent,
    ]);

    jest.spyOn(fs, 'stat');
    jest.mocked(fs.stat).mockResolvedValue({ mtimeMs: oldFileTime } as Stats);

    jest.spyOn(fs, 'unlink');
    jest.mocked(fs.unlink).mockResolvedValue(undefined);

    const result = await service.removeOrphaned();

    expect(result).toBe(0);
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('should not delete orphaned files younger than 24 hours', async () => {
    const now = new Date('2026-09-23T12:00:00Z').getTime();
    const newFileTime = now - 23 * 60 * 60 * 1000;

    jest.spyOn(Date, 'now').mockReturnValue(now);

    const mockFindMany = prisma.listingPhotos.findMany as unknown as ReturnType<typeof jest.fn>;
    mockFindMany.mockResolvedValue([]);

    jest.spyOn(fs, 'readdir');
    jest.mocked(fs.readdir).mockResolvedValue([
      { name: 'new-orphan.jpg', isFile: () => true } as Dirent,
    ]);

    jest.spyOn(fs, 'stat');
    jest.mocked(fs.stat).mockResolvedValue({ mtimeMs: newFileTime } as Stats);

    jest.spyOn(fs, 'unlink');
    jest.mocked(fs.unlink).mockResolvedValue(undefined);

    const result = await service.removeOrphaned();

    expect(result).toBe(0);
    expect(fs.unlink).not.toHaveBeenCalled();
  });
});
