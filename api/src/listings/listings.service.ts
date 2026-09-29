import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListListingsDto } from './dto/list-listings.dto.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { UpdatePhotoDto } from './dto/update-photo.dto.js';
import { buildListingsWhere } from './listings.where.js';
import {
  canTransition,
  getAllowedTransitions,
} from '../common/listingStatusTransitions.service.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../errors/app.exception.js';
import { UserRole, ListingStatus, Prisma, Listings } from '../generated/prisma/index.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ListingPublishedEvent } from './events/listing-published.event.js';
import path from 'path';
import fs from 'fs';
import { PassThrough } from 'stream';
import { PdfService } from '../pdf/pdf.service.js';
import { PublisherService } from '../queue/publisher.service.js';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly events: EventEmitter2,
    private readonly pdfService: PdfService,
    private readonly publisherService: PublisherService,
    private readonly logger: PinoLogger,
  ) { }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') throw new NotFoundError('Listing not found');
      if (error.code === 'P2002') {
        const targetArray = error.meta?.target as string[] | undefined;
        const constraintName = targetArray?.join('_') || 'constraint';
        throw new ConflictError(
          `Unique constraint failed on ${constraintName}`,
          [constraintName],
        );
      }
    }
    throw error;
  }

  async findAll(dto: ListListingsDto, user: { id: number; role: string }) {
    const pageSizeDefault = Number(
      this.configService.get<number>('PAGE_SIZE_DEFAULT') ?? 20,
    );
    const pageSizeMax = Number(
      this.configService.get<number>('PAGE_SIZE_MAX') ?? 100,
    );

    const finalPage = !dto.page || dto.page < 1 ? 1 : dto.page;
    let finalLimit = !dto.limit || dto.limit < 1 ? pageSizeDefault : dto.limit;
    if (finalLimit > pageSizeMax) finalLimit = pageSizeMax;

    const isAgent = user.role === UserRole.agent;
    const whereCondition = buildListingsWhere(dto, user.id, isAgent);

    const sortField = dto.sortBy ?? 'createdAt';
    const sortOrder = dto.sortOrder ?? 'desc';
    const orderByCondition = { [sortField]: sortOrder };

    const [items, total] = await Promise.all([
      this.prisma.listings.findMany({
        where: whereCondition,
        orderBy: orderByCondition,
        skip: (finalPage - 1) * finalLimit,
        take: finalLimit,
        include: {
          agent: { select: { id: true, name: true, email: true } },
          district: true,
          photos: { orderBy: { position: 'asc' } },
        },
      }),
      this.prisma.listings.count({ where: whereCondition }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / finalLimit) : 0;

    return {
      items,
      meta: { page: finalPage, limit: finalLimit, total, totalPages },
    };
  }

  async create(dto: CreateListingDto, agentId: number): Promise<Listings> {
    try {
      const { districtId, ...restDto } = dto;
      return await this.prisma.listings.create({
        data: {
          ...restDto,
          status: ListingStatus.DRAFT,
          agent: { connect: { id: agentId } },
          district: { connect: { id: districtId } },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async findOne(id: number, user: { id: number; role: string }) {
    const listing = await this.prisma.listings.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        district: true,
        photos: { orderBy: { position: 'asc' } },
        _count: { select: { viewings: true } },
      },
    });

    if (!listing) throw new NotFoundError('Listing not found');
    if (user.role === UserRole.agent && listing.agentId !== user.id)
      throw new ForbiddenError('You do not have access to this listing');

    return {
      ...listing,
      allowedTransitions: getAllowedTransitions(listing.status),
    };
  }

  async update(
    id: number,
    dto: UpdateListingDto,
    user: { id: number; role: string },
  ): Promise<Listings> {
    await this.findOne(id, user);
    try {
      return await this.prisma.listings.update({
        where: { id },
        data: { ...dto, updatedAt: new Date() },
      });
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }

  async expireOldListings(): Promise<{ processed: number; errors: number }> {
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const listingsList = await this.prisma.listings.findMany({
      where: {
        status: ListingStatus.PUBLISHED,
        publishedAt: { lte: cutoff },
      },
      select: { id: true },
    });

    let processed = 0;
    let errors = 0;

    for (const listing of listingsList) {
      try {
        await this.updateStatus(
          listing.id,
          { status: ListingStatus.UNPUBLISHED },
          { expired: true },
        );
        processed++;
      } catch {
        errors++;
      }
    }

    return { processed, errors };
  }

  async updateStatus(
    id: number,
    dto: UpdateStatusDto,
    options?: { expired?: boolean },
  ): Promise<unknown> {
    try {
      const updatedListing = await this.prisma.$transaction(async (tx) => {
        const listing = await tx.listings.findUnique({ where: { id } });
        if (!listing) throw new NotFoundError('Listing not found');

        if (!canTransition(listing.status, dto.status)) {
          const allowed = getAllowedTransitions(listing.status).join(', ');
          throw new ConflictError(
            `Transition from ${listing.status} to ${dto.status} is not allowed`,
            [allowed],
          );
        }

        const changedAt = new Date();
        const updateData: Prisma.ListingsUpdateInput = {
          status: dto.status,
          updatedAt: changedAt,
        };

        if (dto.status === ListingStatus.PUBLISHED)
          updateData.publishedAt = changedAt;

        const updated = await tx.listings.update({
          where: { id },
          data: updateData,
          include: {
            agent: { select: { id: true, name: true, email: true } },
            district: true,
            photos: { orderBy: { position: 'asc' } },
          },
        });

        await tx.listingStatusHistory.create({
          data: {
            listingId: updated.id,
            agentId: updated.agentId,
            fromStatus: listing.status,
            toStatus: updated.status,
            createdAt: changedAt,
          },
        });

        return updated;
      });

      if (updatedListing.status === ListingStatus.PUBLISHED) {
        this.logger.info(
          {
            listingId: updatedListing.id,
            agentId: updatedListing.agentId,
          },
          'Listing published',
        );

        this.events.emit(
          ListingPublishedEvent.eventName,
          new ListingPublishedEvent(
            updatedListing.id,
            updatedListing.agentId,
            updatedListing.title,
          ),
        );

        this.publisherService.publish(
          'listing.published',
          {
            listingId: updatedListing.id,
          },
          {
            messageId: `listing-published:${updatedListing.id}`,
          },
        );
      }

      if (updatedListing.status === ListingStatus.UNPUBLISHED) {
        if (!options?.expired) {
          this.logger.info(
            {
              listingId: updatedListing.id,
              agentId: updatedListing.agentId,
            },
            'Listing unpublished',
          );
        }

        if (options?.expired) {
          this.publisherService.publish(
            'listing.expired',
            {
              listingId: updatedListing.id,
              agentId: updatedListing.agentId,
              title: updatedListing.title,
            },
            {
              messageId: `listing-expired:${updatedListing.id}`,
            },
          );
        }
      }

      return {
        ...updatedListing,
        allowedTransitions: getAllowedTransitions(updatedListing.status),
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findPhotos(listingId: number) {
    const listing = await this.prisma.listings.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundError('Listing not found');
    return await this.prisma.listingPhotos.findMany({
      where: { listingId },
      orderBy: { position: 'asc' },
    });
  }

  async updatePhoto(listingId: number, photoId: number, dto: UpdatePhotoDto) {
    const photo = await this.prisma.listingPhotos.findFirst({
      where: { id: photoId, listingId },
    });
    if (!photo) throw new NotFoundError('Photo not found for this listing');

    return await this.prisma.$transaction(async (tx) => {
      if (dto.isCover === true)
        await tx.listingPhotos.updateMany({
          where: { listingId, isCover: true },
          data: { isCover: false },
        });
      return await tx.listingPhotos.update({
        where: { id: photoId },
        data: {
          ...(dto.position !== undefined && { position: dto.position }),
          ...(dto.isCover !== undefined && { isCover: dto.isCover }),
          updatedAt: new Date(),
        },
      });
    });
  }

  async uploadPhotos(
    listingId: number,
    files: Express.Multer.File[],
  ): Promise<unknown>  {
    if (!files || files.length === 0) return [];

    const cleanUploadedFiles = () => {
      for (const file of files) {
        const filePath = path.resolve(`./uploads/photos/${file.filename}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingPhotos = await tx.listingPhotos.findMany({
          where: { listingId },
          orderBy: { position: 'asc' },
        });

        if (existingPhotos.length + files.length > 5)
          throw new ConflictError(
            `Limit exceeded. Already has ${existingPhotos.length} photos. Cannot add ${files.length} more (max 5).`,
          );

        let currentMaxPosition = existingPhotos.reduce(
          (max, p) => ((p.position ?? 0) > max ? (p.position ?? 0) : max),
          0,
        );
        const hasCover = existingPhotos.some((p) => p.isCover);

        const createData = files.map((file, index) => {
          currentMaxPosition++;
          return {
            listingId,
            fileName: file.filename,
            externalUrl: null,
            position: currentMaxPosition,
            sizeBytes: file.size,
            isCover: !hasCover && index === 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        await tx.listingPhotos.createMany({ data: createData });

        return await tx.listingPhotos.findMany({
          where: { listingId },
          orderBy: { position: 'asc' },
        });
      });
    } catch (error) {
      cleanUploadedFiles();
      throw error;
    }
  }

  async deletePhoto(listingId: number, photoId: number): Promise<unknown> {
    return await this.prisma.$transaction(async (tx) => {
      const photo = await tx.listingPhotos.findFirst({
        where: { id: photoId, listingId },
      });
      if (!photo) throw new NotFoundError('Photo not found');
      await tx.listingPhotos.delete({ where: { id: photoId } });

      if (photo.isCover) {
        const nextPhoto = await tx.listingPhotos.findFirst({
          where: { listingId },
          orderBy: { position: 'asc' },
        });
        if (nextPhoto)
          await tx.listingPhotos.update({
            where: { id: nextPhoto.id },
            data: { isCover: true },
          });
      }

      if (photo.fileName) {
        const filePath = path.resolve(`./uploads/photos/${photo.fileName}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      return { success: true };
    });
  }

  async getListingPdfStream(
    id: number,
    user: { id: number; role: string },
  ): Promise<PassThrough> {
    const listing = await this.prisma.listings.findUnique({
      where: { id },
      include: {
        district: true,
        agent: true,
        photos: { orderBy: { position: 'asc' } },
      },
    });

    if (!listing) throw new NotFoundError('Listing not found');
    if (user.role !== UserRole.moderator && listing.agentId !== user.id)
      throw new ForbiddenError('You do not have access to this listing');
    const pdfStream = new PassThrough();
    this.pdfService.streamListingCard(pdfStream, {
      ...listing,
      price: Number(listing.price),
      area: Number(listing.area),
    });
    return pdfStream;
  }
  async getListingsBundleStream(ids: number[]): Promise<PassThrough> {
    const listingsList = await this.prisma.listings.findMany({
      where: { id: { in: ids } },
      include: {
        district: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    });
    if (!listingsList.length) throw new NotFoundError('No listings found for given ids');
    const pdfStream = new PassThrough();
    this.pdfService.streamListingsBundle(
      pdfStream,
      listingsList.map((item) => ({
        ...item,
        price: Number(item.price),
        area: Number(item.area),
      })),
    );
    return pdfStream;
  }
}
