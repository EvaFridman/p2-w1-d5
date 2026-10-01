import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/index.js';
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
  ValidationError,
} from '../errors/app.exception.js';
import {
  isCatalogQuerySupported,
  normalizeCatalogQuery,
} from './catalog-query.js';

export const SAVED_SEARCH_LIMIT = 10;
const DEFAULT_NAME_PREFIX = 'Поиск';

type SavedSearchRecord = {
  id: number;
  name: string;
  token: string;
  query: string;
  createdAt: Date;
};

export const toNameKey = (name: string): string => name.trim().toLowerCase();

export function nextDefaultName(takenNameKeys: string[]): string {
  const taken = new Set(takenNameKeys);
  let n = 1;
  while (taken.has(toNameKey(`${DEFAULT_NAME_PREFIX} ${n}`))) n++;
  return `${DEFAULT_NAME_PREFIX} ${n}`;
}

const toView = (search: SavedSearchRecord) => ({
  id: search.id,
  name: search.name,
  token: search.token,
  query: search.query,
  isOutdated: !isCatalogQuerySupported(search.query),
  createdAt: search.createdAt,
});

@Injectable()
export class SavedSearchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: number, dto: { query: string; name?: string }) {
    const query = normalizeCatalogQuery(dto.query);
    if (!isCatalogQuerySupported(query))
      throw new ValidationError(
        'Search parameters are not supported by the catalog',
        null,
        'SAVED_SEARCH_INVALID_QUERY',
      );

    const existing = await this.prisma.savedSearches.findMany({
      where: { userId },
      select: { nameKey: true, query: true },
    });

    if (existing.some((search) => search.query === query))
      throw new ConflictError(
        'This search is already saved',
        null,
        'SAVED_SEARCH_DUPLICATE_QUERY',
      );

    const name =
      dto.name?.trim() ||
      nextDefaultName(existing.map((search) => search.nameKey));
    const nameKey = toNameKey(name);

    if (existing.some((search) => search.nameKey === nameKey))
      throw new ConflictError(
        'A saved search with this name already exists',
        null,
        'SAVED_SEARCH_DUPLICATE_NAME',
      );

    if (existing.length >= SAVED_SEARCH_LIMIT)
      throw new UnprocessableEntityError(
        `No more than ${SAVED_SEARCH_LIMIT} saved searches`,
        null,
        'SAVED_SEARCH_LIMIT',
      );

    try {
      const created = await this.prisma.savedSearches.create({
        data: {
          userId,
          name,
          nameKey,
          query,
          token: randomBytes(16).toString('hex'),
        },
      });
      this.logger.info(
        { savedSearchId: created.id, userId },
        'Saved search created',
      );
      return toView(created);
    } catch (error) {
      // A parallel request saved the same search between the check and the insert.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictError(
          'This search is already saved',
          null,
          JSON.stringify(error.meta).includes('nameKey')
            ? 'SAVED_SEARCH_DUPLICATE_NAME'
            : 'SAVED_SEARCH_DUPLICATE_QUERY',
        );
      throw error;
    }
  }

  async findAll(userId: number) {
    const searches = await this.prisma.savedSearches.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return searches.map(toView);
  }

  async remove(userId: number, id: number) {
    const { count } = await this.prisma.savedSearches.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundError('Saved search not found');

    this.logger.info({ savedSearchId: id, userId }, 'Saved search deleted');
    return { id };
  }

  async findByToken(token: string) {
    const search = await this.prisma.savedSearches.findUnique({
      where: { token },
      select: { query: true },
    });
    if (!search) throw new NotFoundError('Saved search not found');

    return {
      query: search.query,
      isOutdated: !isCatalogQuerySupported(search.query),
    };
  }
}
