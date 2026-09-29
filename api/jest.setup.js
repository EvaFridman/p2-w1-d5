import { jest } from '@jest/globals';

jest.mock('@nestjs/throttler', () => ({
  Throttle: () => (target, key, descriptor) => {
    return descriptor || target;
  },
}));
