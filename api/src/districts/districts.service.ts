import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateDistrictDto } from './dto/create-district.dto.js';
import { UpdateDistrictDto } from './dto/update-district.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundError } from '../errors/app.exception.js';
import type { District } from './districts.types.js';

@Injectable()
export class DistrictsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: CreateDistrictDto): Promise<District> {
    return await this.prisma.districts.create({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    });
  }

  async findAll(page?: number, limit?: number, city?: string) {
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
    const whereCondition = finalCity ? { city: finalCity } : {};

    const [items, total] = await Promise.all([
      this.prisma.districts.findMany({
        where: whereCondition,
        skip: (finalPage - 1) * finalLimit,
        take: finalLimit,
      }),
      this.prisma.districts.count({ where: whereCondition }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / finalLimit) : 0;

    return {
      items,
      meta: { page: finalPage, limit: finalLimit, total, totalPages },
    };
  }

  async findOne(id: number): Promise<District> {
    const district = await this.prisma.districts.findUnique({ where: { id } });
    if (!district) throw new NotFoundError('District not found');
    return district;
  }

  async count(): Promise<number> {
    return this.prisma.districts.count();
  }

  async update(id: number, data: UpdateDistrictDto): Promise<District> {
    try {
      return await this.prisma.districts.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });
    } catch {
      throw new NotFoundError('District not found');
    }
  }

  // remove(id: number) {
  //   return `This action removes a #${id} district`;
  // }
}
