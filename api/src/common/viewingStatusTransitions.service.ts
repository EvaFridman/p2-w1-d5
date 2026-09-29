import { ViewingStatus as VIEWING_STATUS } from '../generated/prisma/index.js';

export const ALLOWED_TRANSITIONS: Record<
  VIEWING_STATUS,
  readonly VIEWING_STATUS[]
> = {
  [VIEWING_STATUS.CREATED]: [VIEWING_STATUS.PENDING_APPROVAL],
  [VIEWING_STATUS.PENDING_APPROVAL]: [
    VIEWING_STATUS.APPROVED,
    VIEWING_STATUS.REJECTED,
  ],
  [VIEWING_STATUS.APPROVED]: [VIEWING_STATUS.CLOSED],
  [VIEWING_STATUS.REJECTED]: [VIEWING_STATUS.CLOSED],
  [VIEWING_STATUS.CLOSED]: [],
};

export const VIEWING_STATUSES = Object.keys(
  ALLOWED_TRANSITIONS,
) as VIEWING_STATUS[];

export function canTransition(
  from: VIEWING_STATUS,
  to: VIEWING_STATUS,
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(
  currentStatus: VIEWING_STATUS,
): VIEWING_STATUS[] {
  return [...(ALLOWED_TRANSITIONS[currentStatus] ?? [])];
}
