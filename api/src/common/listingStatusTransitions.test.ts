import {
  canTransition,
  getAllowedTransitions,
} from './listingStatusTransitions.service.js';

describe('listingStatusTransitions', () => {
  const validTransitions = [
    ['DRAFT', 'MODERATION'],
    ['MODERATION', 'PUBLISHED'],
    ['MODERATION', 'REJECTED'],
    ['REJECTED', 'MODERATION'],
    ['PUBLISHED', 'UNPUBLISHED'],
    ['UNPUBLISHED', 'MODERATION'],
  ] as const;

  test.each(validTransitions)('from %s to %s should be allowed', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  const invalidTransitions = [
    ['DRAFT', 'REJECTED'],
    ['DRAFT', 'PUBLISHED'],
    ['PUBLISHED', 'DRAFT'],
    ['MODERATION', 'MODERATION'],
    ['REJECTED', 'DRAFT'],
    ['REJECTED', 'PUBLISHED'],
    ['UNPUBLISHED', 'PUBLISHED'],
    ['UNPUBLISHED', 'DRAFT'],
  ] as const;

  test.each(invalidTransitions)(
    'from %s to %s should be disallowed',
    (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    },
  );
});

describe('getAllowedTransitions', () => {
  const expectedAllowedTransitions = [
    ['DRAFT', ['MODERATION']],
    ['MODERATION', ['PUBLISHED', 'REJECTED']],
    ['REJECTED', ['MODERATION']],
    ['PUBLISHED', ['UNPUBLISHED']],
    ['UNPUBLISHED', ['MODERATION']],
  ] as const;

  test.each(expectedAllowedTransitions)(
    'should return correct allowed transitions for status "%s"',
    (status, expectedAllowed) => {
      expect(getAllowedTransitions(status)).toEqual(expectedAllowed);
    },
  );
});
