export function pricePerSquareMeter(
  price: number,
  area: number,
): number | null {
  if (!area || area <= 0) return null;
  return Math.round((price / area) * 100) / 100;
}
