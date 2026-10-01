import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PublicListingsDto } from '../public/dto/public-listings.dto.js';

export const CATALOG_QUERY_KEYS = [
  'areaMax',
  'areaMin',
  'dealType',
  'districtId',
  'priceMax',
  'priceMin',
  'propertyType',
  'rooms',
  'search',
  'sortBy',
  'sortOrder',
] as const;

const DEFAULT_SORT = { sortBy: 'publishedAt', sortOrder: 'desc' } as const;

const isCatalogKey = (key: string): boolean =>
  (CATALOG_QUERY_KEYS as readonly string[]).includes(key);

const compareRooms = (a: string, b: string): number =>
  Number(a) - Number(b) || a.localeCompare(b);

export function normalizeCatalogQuery(raw: string): string {
  const input = new URLSearchParams(raw);
  const output = new URLSearchParams();

  for (const key of CATALOG_QUERY_KEYS) {
    if (key === 'rooms') {
      const rooms = input
        .getAll(key)
        .map((value) => value.trim())
        .filter(Boolean);
      [...new Set(rooms)]
        .sort(compareRooms)
        .forEach((room) => output.append(key, room));
      continue;
    }

    const value =
      input.get(key)?.trim() ||
      (key === 'sortBy' || key === 'sortOrder' ? DEFAULT_SORT[key] : '');
    if (value) output.set(key, value);
  }

  return output.toString();
}

export function isCatalogQuerySupported(query: string): boolean {
  const params = new URLSearchParams(query);
  const plain: Record<string, string | string[]> = {};

  for (const key of new Set(params.keys())) {
    if (!isCatalogKey(key)) return false;
    plain[key] = key === 'rooms' ? params.getAll(key) : (params.get(key) ?? '');
  }

  return validateSync(plainToInstance(PublicListingsDto, plain)).length === 0;
}
