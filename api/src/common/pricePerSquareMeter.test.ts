import { pricePerSquareMeter } from './pricePerSquareMeter.service.js';

describe('pricePerSquareMeter', () => {
  it('returns price divided by area', () => {
    expect(pricePerSquareMeter(100000, 50)).toBe(2000);
    expect(pricePerSquareMeter(120000, 30)).toBe(4000);
  });

  it('returns null if area is 0', () => {
    expect(pricePerSquareMeter(100000, 0)).toBeNull();
  });

  it('returns 0 if price is 0', () => {
    expect(pricePerSquareMeter(0, 50)).toBe(0);
  });
});
