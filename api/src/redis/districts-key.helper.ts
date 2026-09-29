export function generateDistrictsCacheKey(
  page: number,
  limit: number,
  city?: string,
): string {
  return `districts:v1:city=${city || 'all'}:page=${page}:limit=${limit}`;
}
