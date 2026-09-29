import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { PrismaService } from '../prisma/prisma.service.js';

const UPLOAD_DIR = path.resolve('./uploads/photos');
const FILE_MAX_AGE = 24 * 60 * 60 * 1000;

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async removeOrphaned(): Promise<number> {
    const files = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
    const photos = await this.prisma.listingPhotos.findMany({
      where: { fileName: { not: null } },
      select: { fileName: true },
    });

    const attachedFiles = new Set(photos.map((photo) => photo.fileName));
    const cutoff = Date.now() - FILE_MAX_AGE;
    let removed = 0;

    for (const file of files) {
      if (!file.isFile() || attachedFiles.has(file.name)) continue;

      const filePath = path.join(UPLOAD_DIR, file.name);
      const stats = await fs.stat(filePath);

      if (stats.mtimeMs >= cutoff) continue;

      await fs.unlink(filePath);
      removed++;
    }

    return removed;
  }
}
