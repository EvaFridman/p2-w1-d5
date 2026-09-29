import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import fs from 'fs/promises';
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
    (jest.spyOn(prisma.listingPhotos, 'findMany') as any).mockResolvedValue([]);
    (jest.spyOn(fs, 'readdir') as any).mockResolvedValue([
      { name: 'orphan.jpg', isFile: () => true },
    ]);
    (jest.spyOn(fs, 'stat') as any).mockResolvedValue({ mtimeMs: oldFileTime });
    (jest.spyOn(fs, 'unlink') as any).mockResolvedValue(undefined);

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
    (jest.spyOn(prisma.listingPhotos, 'findMany') as any).mockResolvedValue([
      { fileName: 'attached.jpg' },
    ]);
    (jest.spyOn(fs, 'readdir') as any).mockResolvedValue([
      { name: 'attached.jpg', isFile: () => true },
    ]);
    (jest.spyOn(fs, 'stat') as any).mockResolvedValue({ mtimeMs: oldFileTime });
    (jest.spyOn(fs, 'unlink') as any).mockResolvedValue(undefined);

    const result = await service.removeOrphaned();

    expect(result).toBe(0);
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it('should not delete orphaned files younger than 24 hours', async () => {
    const now = new Date('2026-09-23T12:00:00Z').getTime();
    const newFileTime = now - 23 * 60 * 60 * 1000;

    jest.spyOn(Date, 'now').mockReturnValue(now);
    (jest.spyOn(prisma.listingPhotos, 'findMany') as any).mockResolvedValue([]);
    (jest.spyOn(fs, 'readdir') as any).mockResolvedValue([
      { name: 'new-orphan.jpg', isFile: () => true },
    ]);
    (jest.spyOn(fs, 'stat') as any).mockResolvedValue({ mtimeMs: newFileTime });
    (jest.spyOn(fs, 'unlink') as any).mockResolvedValue(undefined);

    const result = await service.removeOrphaned();

    expect(result).toBe(0);
    expect(fs.unlink).not.toHaveBeenCalled();
  });
});
