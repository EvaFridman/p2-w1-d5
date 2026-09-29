import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListFavoritesDto } from './dto/list-favorites.dto.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../errors/app.exception.js';
import { UserRole, Prisma } from '../generated/prisma/index.js';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private handlePrismaError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new ConflictError(
          'This listing is already in favorites',
          ['favorites_userId_listingId_unique_idx'],
        );
      if (error.code === 'P2025')
        throw new NotFoundError('Favorite record not found');
    }
    throw error;
  }


  private checkAccess(
    targetUserId: number,
    currentUser: { id: number; role: string },
  ) {
    if (currentUser.role === UserRole.agent && targetUserId !== currentUser.id)
      throw new ForbiddenError('You can only manage your own favorites');
  }

  async add(
    userId: number,
    listingId: number,
    currentUser: { id: number; role: string },
  ) {
    this.checkAccess(userId, currentUser);
    try {
      return await this.prisma.favorites.create({
        data: {
          userId,
          listingId,
          addedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(
    userId: number,
    listingId: number,
    currentUser: { id: number; role: string },
  ) {
    this.checkAccess(userId, currentUser);
    try {
      return await this.prisma.favorites.delete({
        where: { userId_listingId: { userId, listingId } },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(
    userId: number,
    dto: ListFavoritesDto,
    currentUser: { id: number; role: string },
  ) {
    this.checkAccess(userId, currentUser);

    const pageSizeDefault = Number(
      this.configService.get<number>('PAGE_SIZE_DEFAULT') ?? 20,
    );
    const pageSizeMax = Number(
      this.configService.get<number>('PAGE_SIZE_MAX') ?? 100,
    );

    const finalPage = !dto.page || dto.page < 1 ? 1 : dto.page;
    let finalLimit = !dto.limit || dto.limit < 1 ? pageSizeDefault : dto.limit;
    if (finalLimit > pageSizeMax) finalLimit = pageSizeMax;

    try {
      const [items, total] = await Promise.all([
        this.prisma.favorites.findMany({
          where: { userId },
          skip: (finalPage - 1) * finalLimit,
          take: finalLimit,
          include: {
            listing: {
              include: {
                agent: { select: { id: true, name: true, email: true } },
                district: true,
                photos: { orderBy: { position: 'asc' } },
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        }),
        this.prisma.favorites.count({ where: { userId } }),
      ]);

      const totalPages = total > 0 ? Math.ceil(total / finalLimit) : 0;

      return {
        items,
        meta: { page: finalPage, limit: finalLimit, total, totalPages },
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }
}
