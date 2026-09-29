import { Prisma } from '../generated/prisma/index.js';
import { ListListingsDto } from './dto/list-listings.dto.js';

export function buildListingsWhere(
  dto: ListListingsDto,
  currentUserId?: number,
  isAgent: boolean = false,
): Prisma.ListingsWhereInput {
  const where: Prisma.ListingsWhereInput = {};

  if (isAgent && currentUserId) {
    where.agentId = currentUserId;
  } else if (dto.districtId) {
    where.districtId = dto.districtId;
  }

  if (dto.dealType) where.dealType = dto.dealType;
  if (dto.propertyType) where.propertyType = dto.propertyType;
  if (dto.status) where.status = dto.status.toUpperCase() as any;

  if (dto.rooms && dto.rooms.length > 0) where.rooms = { in: dto.rooms };

  if (dto.priceMin != null || dto.priceMax != null) {
    where.price = {};
    if (dto.priceMin != null) where.price.gte = dto.priceMin;
    if (dto.priceMax != null) where.price.lte = dto.priceMax;
  }

  if (dto.areaMin != null || dto.areaMax != null) {
    where.area = {};
    if (dto.areaMin != null) where.area.gte = dto.areaMin;
    if (dto.areaMax != null) where.area.lte = dto.areaMax;
  }

  if (dto.search && dto.search.trim() !== '') {
    const searchString = dto.search.trim();
    where.OR = [
      { title: { contains: searchString, mode: 'insensitive' } },
      { address: { contains: searchString, mode: 'insensitive' } },
    ];
  }

  if (dto.agentId) {
    where.agentId = dto.agentId;
  }

  return where;
}
