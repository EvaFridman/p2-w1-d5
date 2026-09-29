import { proxyActivities } from '@temporalio/workflow';
import type { DailyDigestActivities } from '../activities/daily-digest.activity.js';

const { dailyDigestActivity } = proxyActivities<DailyDigestActivities>({
  startToCloseTimeout: '10 minutes',
});

export async function dailyDigestWorkflow(): Promise<
  { processed: number; errors: number } | undefined
> {
  return dailyDigestActivity();
}
