const REVALIDATE_SECONDS = 3600;

const cacheStartedAt = Date.now();

export const catalogCacheValidUntil = new Date(cacheStartedAt + REVALIDATE_SECONDS * 1000);
