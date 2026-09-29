import { canTransition } from './viewingStatusTransitions.service.js';

describe('viewingStatusTransitions', () => {
  const validTransitions = [
    ['CREATED', 'PENDING_APPROVAL'],
    ['PENDING_APPROVAL', 'APPROVED'],
    ['PENDING_APPROVAL', 'REJECTED'],
    ['APPROVED', 'CLOSED'],
    ['REJECTED', 'CLOSED'],
  ] as const;

  test.each(validTransitions)('from %s to %s should be allowed', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  const invalidTransitions = [
    ['CREATED', 'APPROVED'],
    ['CREATED', 'REJECTED'],
    ['CREATED', 'CLOSED'],
    ['PENDING_APPROVAL', 'CREATED'],
    ['PENDING_APPROVAL', 'PENDING_APPROVAL'],
    ['PENDING_APPROVAL', 'CLOSED'],
    ['APPROVED', 'PENDING_APPROVAL'],
    ['APPROVED', 'REJECTED'],
    ['REJECTED', 'APPROVED'],
    ['REJECTED', 'PENDING_APPROVAL'],
    ['CLOSED', 'CREATED'],
    ['CLOSED', 'APPROVED'],
  ] as const;

  test.each(invalidTransitions)(
    'from %s to %s should be disallowed',
    (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    },
  );
});
