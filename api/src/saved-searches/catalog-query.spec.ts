import {
  isCatalogQuerySupported,
  normalizeCatalogQuery,
} from './catalog-query.js';

describe('normalizeCatalogQuery', () => {
  it('drops page, limit and keys the catalog does not use', () => {
    expect(
      normalizeCatalogQuery('dealType=rent&page=3&limit=20&view=grid'),
    ).toBe('dealType=rent&sortBy=publishedAt&sortOrder=desc');
  });

  it('drops empty values and trims search', () => {
    expect(normalizeCatalogQuery('propertyType=&search=%20двушка%20')).toBe(
      'search=%D0%B4%D0%B2%D1%83%D1%88%D0%BA%D0%B0&sortBy=publishedAt&sortOrder=desc',
    );
  });

  it('fills the catalog default sort only when it is missing', () => {
    expect(normalizeCatalogQuery('')).toBe('sortBy=publishedAt&sortOrder=desc');
    expect(normalizeCatalogQuery('sortBy=price&sortOrder=asc')).toBe(
      'sortBy=price&sortOrder=asc',
    );
  });

  it('sorts rooms numerically and removes repeats', () => {
    expect(normalizeCatalogQuery('rooms=3&rooms=1&rooms=10&rooms=1')).toBe(
      'rooms=1&rooms=3&rooms=10&sortBy=publishedAt&sortOrder=desc',
    );
  });

  it('gives the same result regardless of parameter order', () => {
    const a = normalizeCatalogQuery(
      'priceMax=9000000&rooms=2&dealType=sale&rooms=1&districtId=4',
    );
    const b = normalizeCatalogQuery(
      'districtId=4&rooms=1&dealType=sale&rooms=2&priceMax=9000000&page=2',
    );
    expect(a).toBe(b);
    expect(a).toBe(
      'dealType=sale&districtId=4&priceMax=9000000&rooms=1&rooms=2&sortBy=publishedAt&sortOrder=desc',
    );
  });

  it('treats an explicit default sort the same as a missing one', () => {
    expect(normalizeCatalogQuery('dealType=sale')).toBe(
      normalizeCatalogQuery('sortOrder=desc&dealType=sale&sortBy=publishedAt'),
    );
  });
});

describe('isCatalogQuerySupported', () => {
  it('accepts a normalized catalog query', () => {
    expect(
      isCatalogQuerySupported(
        normalizeCatalogQuery(
          'dealType=rent&propertyType=flat&rooms=1&rooms=2&priceMin=10000',
        ),
      ),
    ).toBe(true);
  });

  it('rejects a value the catalog does not accept', () => {
    expect(isCatalogQuerySupported('propertyType=castle')).toBe(false);
    expect(isCatalogQuerySupported('rooms=two')).toBe(false);
    expect(isCatalogQuerySupported('priceMin=-5')).toBe(false);
  });

  it('rejects a parameter the catalog does not have', () => {
    expect(isCatalogQuerySupported('dealType=sale&hasBalcony=true')).toBe(
      false,
    );
  });
});
