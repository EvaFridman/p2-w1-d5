import { ListingStatus as LISTING_STATUS } from '../generated/prisma/index.js';

const ALL_STATUSES = Object.values(LISTING_STATUS);

const ALLOWED_TRANSITIONS: Record<LISTING_STATUS, readonly LISTING_STATUS[]> = {
  [LISTING_STATUS.DRAFT]: [LISTING_STATUS.MODERATION],
  [LISTING_STATUS.MODERATION]: [
    LISTING_STATUS.PUBLISHED,
    LISTING_STATUS.REJECTED,
  ],
  [LISTING_STATUS.REJECTED]: [LISTING_STATUS.MODERATION],
  [LISTING_STATUS.PUBLISHED]: [LISTING_STATUS.UNPUBLISHED],
  [LISTING_STATUS.UNPUBLISHED]: [LISTING_STATUS.MODERATION],
};

export function canTransition(
  from: LISTING_STATUS,
  to: LISTING_STATUS,
): boolean {
  const transitions = ALLOWED_TRANSITIONS[from];
  if (!transitions) return false;
  return transitions.includes(to);
}

export function getAllowedTransitions(
  currentStatus: LISTING_STATUS,
): LISTING_STATUS[] {
  return ALL_STATUSES.filter(
    (status) =>
      status !== currentStatus && canTransition(currentStatus, status),
  );
}
