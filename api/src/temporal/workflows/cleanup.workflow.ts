import { proxyActivities } from '@temporalio/workflow';
import type { CleanupActivities } from '../activities/cleanup.activity.js';

const { cleanupActivity } = proxyActivities<CleanupActivities>({
  startToCloseTimeout: '5 minutes',
});

export async function cleanupWorkflow(): Promise<number | undefined> {
  return cleanupActivity();
}
