import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service.js';
import { PublicListingsDto } from './dto/public-listings.dto.js';
import { CreateViewingDto } from '../viewings/dto/create-viewing.dto.js';
import { ListViewingsDto } from '../viewings/dto/list-viewings.dto.js';
import { buildPublicListingsWhere } from './public.where.js';
import {
  ListingStatus,
  UserRole,
  ViewingStatus,
  Prisma,
} from '../generated/prisma/index.js';
import { NotFoundError, ConflictError } from '../errors/app.exception.js';
import { CacheService } from '../redis/cache.service.js';
import { generateCatalogCacheKey } from '../redis/catalog-key.helper.js';
import { generateDistrictsCacheKey } from '../redis/districts-key.helper.js';
import { PublisherService } from '../queue/publisher.service.js';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly publisherService: PublisherService,
    private readonly logger: PinoLogger,
  ) {}

  async findAllListings(dto: PublicListingsDto) {
    const pageSizeDefault = Number(
      this.configService.get<number>('PAGE_SIZE_DEFAULT') ?? 20,
    );
    const pageSizeMax = Number(
      this.configService.get<number>('PAGE_SIZE_MAX') ?? 100,
    );

    const finalPage = !dto.page || dto.page < 1 ? 1 : dto.page;
    let finalLimit = !dto.limit || dto.limit < 1 ? pageSizeDefault : dto.limit;
    if (finalLimit > pageSizeMax) finalLimit = pageSizeMax;

    const sortField = dto.sortBy ?? 'publishedAt';
    const sortOrder = dto.sortOrder ?? 'desc';

    const cacheKey = generateCatalogCacheKey(
      dto,
      finalPage,
      finalLimit,
      sortField,
      sortOrder,
    );

    const getCached = () =>
      this.cacheService.get<{
        items: unknown[];
        meta: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(cacheKey);

    const cached = await getCached();
    if (cached) return cached;

    let hasLock = false;
    let redisAvailable = true;

    try {
      hasLock = await this.cacheService.acquireLock(cacheKey);
    } catch {
      redisAvailable = false;
    }

    if (redisAvailable && !hasLock) {
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const cachedAfterWait = await getCached();
        if (cachedAfterWait) return cachedAfterWait;

        try {
          hasLock = await this.cacheService.acquireLock(cacheKey);
        } catch {
          redisAvailable = false;
          break;
        }

        if (hasLock) break;
      }
    }

    if (redisAvailable && !hasLock)
      throw new Error('Failed to acquire cache lock');

    try {
      if (redisAvailable) {
        const cachedAfterLock = await getCached();
        if (cachedAfterLock) return cachedAfterLock;
      }

      const whereCondition = buildPublicListingsWhere(dto);
      const orderByCondition = { [sortField]: sortOrder };

      const [items, total] = await Promise.all([
        this.prisma.listings.findMany({
          where: whereCondition,
          orderBy: orderByCondition,
          skip: (finalPage - 1) * finalLimit,
          take: finalLimit,
          select: {
            id: true,
            title: true,
            price: true,
            area: true,
            rooms: true,
            floor: true,
            totalFloors: true,
            dealType: true,
            propertyType: true,
            address: true,
            publishedAt: true,
            district: { select: { id: true, title: true } },
            photos: {
              select: {
                id: true,
                fileName: true,
                externalUrl: true,
                position: true,
                isCover: true,
              },
              orderBy: { position: 'asc' },
            },
          },
        }),
        this.prisma.listings.count({ where: whereCondition }),
      ]);

      const totalPages = total > 0 ? Math.ceil(total / finalLimit) : 0;

      const result = {
        items,
        meta: {
          page: finalPage,
          limit: finalLimit,
          total,
          totalPages,
        },
      };

      if (redisAvailable) {
        try {
          await this.cacheService.set(cacheKey, result, 300);
          await this.cacheService.addToTag('listings', cacheKey);
        } catch {
          // Игнорируем ошибки записи в кэш, чтобы не ломать выдачу пользователю
        }
      }

      return result;
    } finally {
      if (hasLock) {
        try {
          await this.cacheService.releaseLock(cacheKey);
        } catch {
          // Игнорируем ошибки освобождения блокировки в Redis
        }
      }
    }
  }

  async findOneListing(id: number) {
    const listing = await this.prisma.listings.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        agent: { select: { id: true, name: true, avatarFileName: true } },
        id: true,
        price: true,
        area: true,
        rooms: true,
        floor: true,
        totalFloors: true,
        dealType: true,
        propertyType: true,
        address: true,
        publishedAt: true,
        status: true,
        district: { select: { id: true, title: true, city: true } },
        photos: {
          select: {
            id: true,
            fileName: true,
            externalUrl: true,
            position: true,
            isCover: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!listing || listing.status !== ListingStatus.PUBLISHED)
      throw new NotFoundError('Listing not found');

    const { status: _status, ...publicListing } = listing;

    return publicListing;
  }

  async createViewing(
    listingId: number,
    dto: CreateViewingDto,
    user?: { id: number; role: string },
  ) {
    const listing = await this.prisma.listings.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.status !== ListingStatus.PUBLISHED)
      throw new NotFoundError('Listing not found');
    const viewing = await this.prisma.viewings.create({
      data: {
        listingId,
        ...dto,
        clientId: user?.role === UserRole.client ? user.id : null,
        status: ViewingStatus.CREATED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.info(
      {
        viewingId: viewing.id,
        listingId,
        clientId: viewing.clientId,
      },
      'Viewing created',
    );

    try {
      this.publisherService.publish(
        'viewing.booked',
        { viewingId: viewing.id },
        { messageId: `viewing-booked:${viewing.id}` },
      );
    } catch (error) {
      this.logger.error({ err: error }, `Failed to publish viewing.booked`);
    }

    return viewing;
  }

  async findAllFavorites(user: { id: number }) {
    const favorites = await this.prisma.favorites.findMany({
      where: { userId: user.id },
      select: { listingId: true },
      orderBy: { addedAt: 'desc' },
    });

    return favorites.map((favorite) => favorite.listingId);
  }

  async addFavorite(listingId: number, user: { id: number }) {
    const listing = await this.prisma.listings.findUnique({
      where: { id: listingId },
      select: { id: true, status: true },
    });

    if (!listing || listing.status !== ListingStatus.PUBLISHED)
      throw new NotFoundError('Listing not found');

    try {
      await this.prisma.favorites.create({
        data: {
          userId: user.id,
          listingId,
          addedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictError('Favorite already exists');

      throw error;
    }

    return { isFavorite: true };
  }

  async removeFavorite(listingId: number, user: { id: number }) {
    const favorite = await this.prisma.favorites.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } },
    });

    if (!favorite) return { isFavorite: false };

    await this.prisma.favorites.delete({
      where: { userId_listingId: { userId: user.id, listingId } },
    });

    return { isFavorite: false };
  }

  async findAllDistricts(page?: number, limit?: number, city?: string) {
    const pageSizeDefault = Number(
      this.configService.get<number>('PAGE_SIZE_DEFAULT') ?? 20,
    );
    const pageSizeMax = Number(
      this.configService.get<number>('PAGE_SIZE_MAX') ?? 100,
    );

    const finalPage = !page || page < 1 ? 1 : page;
    let finalLimit = !limit || limit < 1 ? pageSizeDefault : limit;
    if (finalLimit > pageSizeMax) finalLimit = pageSizeMax;

    const finalCity = city && city.trim() !== '' ? city.trim() : undefined;

    const cacheKey = generateDistrictsCacheKey(
      finalPage,
      finalLimit,
      finalCity,
    );

    const cached = await this.cacheService.get<{
      items: {
        id: number;
        title: string;
        slug: string;
        city: string;
        publishedListingsCount: number;
      }[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(cacheKey);

    if (cached) return cached;

    const whereCondition = finalCity ? { city: finalCity } : {};

    const [items, total] = await Promise.all([
      this.prisma.districts.findMany({
        where: whereCondition,
        skip: (finalPage - 1) * finalLimit,
        take: finalLimit,
        select: {
          id: true,
          title: true,
          slug: true,
          city: true,
          _count: {
            select: {
              listings: { where: { status: ListingStatus.PUBLISHED } },
            },
          },
        },
        orderBy: { title: 'asc' },
      }),
      this.prisma.districts.count({ where: whereCondition }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / finalLimit) : 0;

    const formattedItems = items.map((d) => ({
      id: d.id,
      title: d.title,
      slug: d.slug,
      city: d.city,
      publishedListingsCount: d._count.listings,
    }));

    const result = {
      items: formattedItems,
      meta: {
        page: finalPage,
        limit: finalLimit,
        total,
        totalPages,
      },
    };

    await this.cacheService.set(cacheKey, result, 86400);

    return result;
  }
  async findDistrictBySlug(slug: string) {
    const district = await this.prisma.districts.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        city: true,
        _count: {
          select: {
            listings: { where: { status: ListingStatus.PUBLISHED } },
          },
        },
      },
    });

    if (!district) throw new NotFoundError('District not found');

    return {
      id: district.id,
      title: district.title,
      slug: district.slug,
      city: district.city,
      publishedListingsCount: district._count.listings,
    };
  }

  async findAgentPhone(id: number) {
    const agent = await this.prisma.users.findFirst({
      where: { id, role: UserRole.agent },
      select: { phone: true },
    });
    if (!agent) throw new NotFoundError('Agent not found');
    return { phone: agent.phone };
  }

  async findBusyViewingTimes(id: number) {
    const viewings = await this.prisma.viewings.findMany({
      where: {
        listingId: id,
        preferredAt: { gte: new Date() },
        status: {
          in: [
            ViewingStatus.CREATED,
            ViewingStatus.PENDING_APPROVAL,
            ViewingStatus.APPROVED,
          ],
        },
      },
      select: { preferredAt: true },
      orderBy: { preferredAt: 'asc' },
    });

    return viewings.map((viewing) => viewing.preferredAt);
  }

  async findMyViewings(dto: ListViewingsDto, user: { id: number }) {
    const pageSizeDefault = Number(
      this.configService.get<number>('PAGE_SIZE_DEFAULT') ?? 20,
    );
    const pageSizeMax = Number(
      this.configService.get<number>('PAGE_SIZE_MAX') ?? 100,
    );

    const finalPage = !dto.page || dto.page < 1 ? 1 : dto.page;
    let finalLimit = !dto.limit || dto.limit < 1 ? pageSizeDefault : dto.limit;
    if (finalLimit > pageSizeMax) finalLimit = pageSizeMax;

    const whereCondition = {
      clientId: user.id,
      ...(dto.status ? { status: dto.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.viewings.findMany({
        where: whereCondition,
        skip: (finalPage - 1) * finalLimit,
        take: finalLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          preferredAt: true,
          status: true,
          comment: true,
          listing: {
            select: {
              id: true,
              title: true,
              photos: {
                select: {
                  id: true,
                  fileName: true,
                  externalUrl: true,
                  position: true,
                  isCover: true,
                },
                orderBy: { position: 'asc' },
              },
              agent: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.viewings.count({ where: whereCondition }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / finalLimit) : 0;

    return {
      items,
      meta: {
        page: finalPage,
        limit: finalLimit,
        total,
        totalPages,
      },
    };
  }

  async findSitemapListings() {
    return await this.prisma.listings.findMany({
      where: { status: ListingStatus.PUBLISHED },
      select: { id: true, updatedAt: true },
    });
  }
}
