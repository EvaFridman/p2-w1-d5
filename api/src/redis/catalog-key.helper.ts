import { PublicListingsDto } from '../public/dto/public-listings.dto.js';

export function generateCatalogCacheKey(
  dto: PublicListingsDto,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string,
): string {
  const params = [
    `district=${dto.districtId ?? 'all'}`,
    `dealType=${dto.dealType ?? 'all'}`,
    `propertyType=${dto.propertyType ?? 'all'}`,
    `rooms=${dto.rooms?.length ? [...dto.rooms].sort().join(',') : 'all'}`,
    `priceMin=${dto.priceMin ?? 'all'}`,
    `priceMax=${dto.priceMax ?? 'all'}`,
    `areaMin=${dto.areaMin ?? 'all'}`,
    `areaMax=${dto.areaMax ?? 'all'}`,
    `search=${dto.search?.trim() || 'all'}`,
    `agentId=${dto.agentId ?? 'all'}`,
    `page=${page}`,
    `limit=${limit}`,
    `sortBy=${sortBy}`,
    `sortOrder=${sortOrder}`,
  ];

  return `listings:published:v1:${params.join(':')}`;
}
