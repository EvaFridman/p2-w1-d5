import { proxyActivities } from '@temporalio/workflow';
import type { ExpireListingsActivities } from '../activities/expire-listings.activity.js';

const { expireListingsActivity } = proxyActivities<ExpireListingsActivities>({
  startToCloseTimeout: '10 minutes',
});

export async function expireListingsWorkflow(): Promise<
  { processed: number; errors: number } | undefined
> {
  return expireListingsActivity();
}
